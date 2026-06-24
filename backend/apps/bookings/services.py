from django.db import transaction
from django.db.models import F, Q
from decimal import Decimal
from datetime import date
from django.conf import settings
import stripe
from apps.bookings.models import Booking, BookingStatus, CartCheckout
from apps.equipment.models import Equipment


class BookingConflictError(Exception):
    pass


class BookingValidationError(Exception):
    pass


@transaction.atomic
def create_booking(
    equipment: Equipment,
    user_id: str,
    start_date: date,
    end_date: date,
    shipping_address: dict | None = None,
    payment_method: str = Booking.PaymentMethod.STRIPE,
) -> Booking:
    """
    Create a booking with full conflict detection.

    Uses SELECT FOR UPDATE to prevent race conditions.
    Raises BookingConflictError if equipment is unavailable.
    Raises BookingValidationError for invalid date ranges.
    """
    if start_date > end_date:
        raise BookingValidationError("Start date must be before end date.")
    if start_date < date.today():
        raise BookingValidationError("Cannot book dates in the past.")

    equipment_locked = Equipment.objects.select_for_update().get(pk=equipment.pk)

    overlapping_count = (
        Booking.objects.filter(equipment=equipment_locked)
        .exclude(status=BookingStatus.CANCELLED)
        .filter(Q(start_date__lte=end_date) & Q(end_date__gte=start_date))
        .count()
    )

    if overlapping_count >= equipment_locked.quantity:
        raise BookingConflictError(
            f"Equipment unavailable for {start_date} – {end_date}. "
            f"All {equipment_locked.quantity} unit(s) are booked."
        )

    days = (end_date - start_date).days + 1
    price_per_day = Decimal(str(equipment_locked.price_per_day))
    breakdown = calculate_price_breakdown(price_per_day, days, equipment, start_date, end_date)
    total_price = breakdown["total"]

    booking = Booking.objects.create(
        equipment=equipment_locked,
        user_id=user_id,
        shipping_address=shipping_address or {},
        payment_method=payment_method,
        start_date=start_date,
        end_date=end_date,
        total_price=total_price,
        status=BookingStatus.CONFIRMED,
    )
    Equipment.objects.filter(pk=equipment_locked.pk).update(booking_count=F("booking_count") + 1)
    return booking


def calculate_price_breakdown(
    base_price_per_day: Decimal,
    days: int,
    equipment: Equipment,
    start_date: date,
    end_date: date,
) -> Decimal:
    """Server-side pricing engine with multi-day discounts, high-demand surges, and weekend surges."""
    base_subtotal = (base_price_per_day * days).quantize(Decimal("0.01"))
    weeks = days // 7
    discount_pct = min(Decimal("0.05") * weeks, Decimal("0.25"))
    discount_amount = (base_subtotal * discount_pct).quantize(Decimal("0.01"))
    total = base_subtotal - discount_amount

    current_bookings = (
        Booking.objects.filter(equipment=equipment)
        .exclude(status=BookingStatus.CANCELLED)
        .filter(Q(start_date__lte=end_date) & Q(end_date__gte=start_date))
        .count()
    )
    demand_rate = current_bookings / max(equipment.quantity, 1)

    surge_multiplier = Decimal("1")
    if demand_rate > 0.6:
        surge_multiplier *= Decimal("1.2")

    if start_date.weekday() in (5, 6) or end_date.weekday() in (5, 6):
        surge_multiplier *= Decimal("1.1")

    total = (total * surge_multiplier).quantize(Decimal("0.01"))

    return {
        "days": days,
        "base_subtotal": base_subtotal,
        "discount_percentage": float(discount_pct),
        "discount_amount": discount_amount,
        "surge_multiplier": float(surge_multiplier),
        "total": total,
    }


def get_available_dates(equipment: Equipment, month: int, year: int) -> list:
    """Return list of unavailable date ranges for a given equipment in a month."""
    bookings = Booking.objects.filter(
        equipment=equipment,
        start_date__year=year,
        start_date__month=month,
    ).exclude(status=BookingStatus.CANCELLED).values("start_date", "end_date")

    return [{"start": str(b["start_date"]), "end": str(b["end_date"])} for b in bookings]


def process_booking_cancellation(booking: Booking) -> dict:
    """Cancels a booking and triggers Stripe refund if necessary."""
    from django.utils import timezone as django_timezone
    from datetime import timedelta

    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        raise ValueError("Cannot cancel a completed or already cancelled booking.")

    refund_processed = False
    refund_error = None

    if booking.payment_method == Booking.PaymentMethod.STRIPE and booking.stripe_payment_intent_id:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            payment_intent = stripe.PaymentIntent.retrieve(booking.stripe_payment_intent_id)
            
            if getattr(payment_intent, "status", None) == "succeeded" and getattr(payment_intent, "amount_received", 0) > 0:
                now = django_timezone.now().date()
                if booking.start_date > now + timedelta(days=1):
                    refund_amount = int(float(booking.total_price) * 100)
                else:
                    refund_amount = int(float(booking.total_price) * 100 * 0.5)
                
                stripe.Refund.create(
                    payment_intent=booking.stripe_payment_intent_id,
                    amount=refund_amount,
                    reason="requested_by_customer",
                )
                
                booking.refund_amount = refund_amount / 100
                booking.refund_status = "processed"
                booking.refund_processed_at = django_timezone.now()
                refund_processed = True
        except stripe.error.StripeError as e:
            refund_error = str(e)

    booking.status = BookingStatus.CANCELLED
    booking.save(update_fields=["status", "refund_amount", "refund_status", "refund_processed_at"])

    return {
        "refund_processed": refund_processed,
        "refund_amount": booking.refund_amount if refund_processed else 0,
        "refund_error": refund_error
    }


@transaction.atomic
def process_cart_checkout(user_id: str, cart_items, payment_method: str, shipping_address: dict):
    """Processes multiple cart items into bookings and creates a CartCheckout intent."""
    from core.subscriptions import vendor_subscription_required
    
    created_bookings = []
    total = 0
    
    for item in cart_items:
        if vendor_subscription_required() and not item.equipment.vendor.subscription_active:
            raise BookingValidationError(f"{item.equipment.name}: vendor subscription is inactive.")
            
        booking = create_booking(
            equipment=item.equipment,
            user_id=user_id,
            start_date=item.start_date,
            end_date=item.end_date,
            shipping_address=shipping_address,
            payment_method=payment_method,
        )
        if payment_method == Booking.PaymentMethod.COD:
            booking.status = BookingStatus.PENDING
            booking.save(update_fields=["status"])
            
        created_bookings.append(booking)
        total += float(booking.total_price)

    checkout = CartCheckout.objects.create(
        user_id=user_id,
        booking_ids=[b.id for b in created_bookings],
        total_amount=total,
        payment_method=payment_method,
        status=CartCheckout.Status.PAID if payment_method == Booking.PaymentMethod.COD else CartCheckout.Status.PENDING,
    )

    client_secret = None
    if payment_method == Booking.PaymentMethod.STRIPE:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.create(
                amount=int(total * 100),
                currency=settings.STRIPE_CURRENCY,
                metadata={
                    "checkout_id": checkout.id,
                    "user_id": user_id,
                    "booking_ids": ",".join(str(b.id) for b in created_bookings),
                },
            )
            checkout.stripe_payment_intent_id = intent["id"]
            checkout.save(update_fields=["stripe_payment_intent_id"])
            client_secret = intent["client_secret"]
        except stripe.error.StripeError as exc:
            Booking.objects.filter(id__in=[b.id for b in created_bookings]).update(status=BookingStatus.CANCELLED)
            checkout.status = CartCheckout.Status.FAILED
            checkout.save(update_fields=["status"])
            raise Exception(str(exc))

    return checkout, created_bookings, client_secret
