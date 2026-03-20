from django.db import transaction
from django.db.models import F, Q
from decimal import Decimal
from datetime import date
from apps.bookings.models import Booking, BookingStatus
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
    # Validate dates
    if start_date > end_date:
        raise BookingValidationError("Start date must be before end date.")
    if start_date < date.today():
        raise BookingValidationError("Cannot book dates in the past.")

    # Lock the equipment row during the transaction
    equipment_locked = Equipment.objects.select_for_update().get(pk=equipment.pk)

    # Count overlapping active bookings
    overlapping_count = (
        Booking.objects.filter(equipment=equipment_locked)
        .exclude(status=BookingStatus.CANCELLED)
        .filter(
            Q(start_date__lt=end_date) & Q(end_date__gt=start_date)
        )
        .count()
    )

    if overlapping_count >= equipment_locked.quantity:
        raise BookingConflictError(
            f"Equipment unavailable for {start_date} – {end_date}. "
            f"All {equipment_locked.quantity} unit(s) are booked."
        )

    # Calculate dynamic price
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
    """
    Server-side pricing engine:
    - Multi-day discount: 5% per full 7-day block, capped at 25%
    - Weekend surcharge: +10%
    - High-demand surcharge: if >60% of units booked in window, +20%
    """
    from apps.bookings.models import Booking

    base_subtotal = (base_price_per_day * days).quantize(Decimal("0.01"))
    weeks = days // 7
    discount_pct = min(Decimal("0.05") * weeks, Decimal("0.25"))
    discount_amount = (base_subtotal * discount_pct).quantize(Decimal("0.01"))
    total = base_subtotal - discount_amount

    # Demand-based pricing
    current_bookings = (
        Booking.objects.filter(equipment=equipment)
        .exclude(status=BookingStatus.CANCELLED)
        .filter(Q(start_date__lt=end_date) & Q(end_date__gt=start_date))
        .count()
    )
    demand_rate = current_bookings / max(equipment.quantity, 1)

    surge_multiplier = Decimal("1")
    if demand_rate > 0.6:
        surge_multiplier *= Decimal("1.2")

    # Weekend check (simplified: if either start or end is weekend)
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

    return [
        {"start": str(b["start_date"]), "end": str(b["end_date"])}
        for b in bookings
    ]
