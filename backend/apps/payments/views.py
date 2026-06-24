import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.bookings.models import Booking, BookingStatus
from .models import Payment
from .serializers import PaymentSerializer
from core.subscriptions import deactivate_vendor_listings

stripe.api_key = settings.STRIPE_SECRET_KEY


DEFAULT_VENDOR_SUBSCRIPTION_PLAN = {
    "product_data": {"name": "TapRent Vendor Pro"},
    "currency": getattr(settings, "STRIPE_CURRENCY", "inr"),
    "unit_amount": 299900,
    "recurring": {"interval": "month"},
}


# Existing helper functions...
def validate_subscription_billing_config():
    if not settings.STRIPE_SECRET_KEY:
        return "Stripe secret key is not configured on the server."
    return None


def build_subscription_item():
    if settings.STRIPE_PRICE_ID:
        return {"price": settings.STRIPE_PRICE_ID}

    plan = DEFAULT_VENDOR_SUBSCRIPTION_PLAN
    unit_amount = plan.get("unit_amount")
    currency = plan.get("currency")
    recurring = plan.get("recurring")

    if unit_amount and currency and recurring:
        return {
            "price_data": {
                "currency": currency,
                "unit_amount": unit_amount,
                "product_data": plan.get("product_data", {"name": "TapRent Vendor Pro"}),
                "recurring": recurring,
            }
        }
    return None


def get_subscription_billing_item_or_error():
    item = build_subscription_item()
    if item:
        return item, None
    return None, "Vendor subscription is not configured. Set STRIPE_PRICE_ID or define a default subscription plan."


def stripe_attr(obj, key, default=None):
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


# Existing views...
class CreatePaymentIntentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(
            Booking, pk=booking_id, user_id=request.user.id, status=BookingStatus.CONFIRMED
        )
        if booking.payment_method == Booking.PaymentMethod.COD:
            return Response({"error": "COD bookings do not require Stripe payment."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = booking.payment
            if payment.status == Payment.Status.SUCCEEDED:
                return Response({"error": "Booking already paid."}, status=status.HTTP_400_BAD_REQUEST)
        except Booking.payment.RelatedObjectDoesNotExist:
            pass

        if not settings.STRIPE_SECRET_KEY:
            return Response({"error": "Stripe is not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if booking.total_price <= 0:
            return Response({"error": "Invalid booking amount."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(booking.total_price * 100),
                currency=settings.STRIPE_CURRENCY,
                metadata={
                    "booking_id": booking.id,
                    "user_id": request.user.id,
                    "equipment_id": booking.equipment.id,
                },
            )
            booking.stripe_payment_intent_id = intent["id"]
            booking.save(update_fields=["stripe_payment_intent_id"])
            return Response({"client_secret": intent["client_secret"]})
        except stripe.error.StripeError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConfirmPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_intent_id = request.data.get("payment_intent_id")
        if not payment_intent_id:
            return Response({"error": "payment_intent_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        booking_id = intent.get("metadata", {}).get("booking_id")
        if not booking_id:
            return Response({"error": "Booking metadata missing from payment intent."}, status=status.HTTP_400_BAD_REQUEST)

        booking = get_object_or_404(Booking, pk=booking_id, user_id=request.user.id)

        payment_status = intent.get("status")
        status_map = {
            "succeeded": Payment.Status.SUCCEEDED,
            "requires_payment_method": Payment.Status.FAILED,
            "requires_action": Payment.Status.PENDING,
            "processing": Payment.Status.PENDING,
        }

        payment, created = Payment.objects.update_or_create(
            stripe_payment_intent_id=payment_intent_id,
            defaults={
                "booking": booking,
                "amount": intent.get("amount", 0) / 100,
                "currency": intent.get("currency", settings.STRIPE_CURRENCY),
                "status": status_map.get(payment_status, Payment.Status.PENDING),
            },
        )

        if payment.status == Payment.Status.SUCCEEDED:
            booking.status = BookingStatus.ACTIVE
            booking.save(update_fields=["status"])

        serializer = PaymentSerializer(payment)
        return Response(serializer.data)


class CreateCheckoutSessionView(APIView):
    """Create a Stripe Checkout session for vendor subscription."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from apps.equipment.models import Vendor

        config_error = validate_subscription_billing_config()
        if config_error:
            return Response({"error": config_error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        subscription_item, subscription_error = get_subscription_billing_item_or_error()
        if subscription_error:
            return Response({"error": subscription_error}, status=status.HTTP_400_BAD_REQUEST)

        vendor, _ = Vendor.objects.get_or_create(
            user_id=request.user.id,
            defaults={"company_name": request.data.get("company_name", "New Vendor")},
        )

        if vendor.subscription_active:
            return Response({"error": "Already subscribed."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        **subscription_item,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=f"{settings.FRONTEND_URL}/vendor?success=true&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/vendor?canceled=true",
                metadata={
                    "vendor_id": vendor.id,
                    "user_id": request.user.id,
                },
            )
            return Response({"url": checkout_session.url, "session_id": checkout_session.id})
        except stripe.error.StripeError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConfirmVendorSubscriptionSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from apps.equipment.models import Vendor

        session_id = request.data.get("session_id", "").strip()
        if not session_id:
            return Response({"error": "session_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        vendor = get_object_or_404(Vendor, user_id=request.user.id)

        try:
            session = stripe.checkout.Session.retrieve(
                session_id,
                expand=["subscription"],
            )
        except stripe.error.StripeError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if stripe_attr(session, "mode") != "subscription":
            return Response({"error": "Checkout session is not a subscription session."}, status=status.HTTP_400_BAD_REQUEST)

        metadata = stripe_attr(session, "metadata", {}) or {}
        if str(stripe_attr(metadata, "user_id")) != str(request.user.id):
            return Response({"error": "This checkout session does not belong to the current vendor."}, status=status.HTTP_403_FORBIDDEN)

        subscription = stripe_attr(session, "subscription")
        subscription_id = ""
        subscription_status = "unknown"

        if subscription:
            subscription_id = stripe_attr(subscription, "id") or ""
            subscription_status = stripe_attr(subscription, "status", "")

        session_status = stripe_attr(session, "status", "") or ""
        payment_status = stripe_attr(session, "payment_status", "") or ""
        activation_ready = (session_status == "complete" and payment_status == "paid") or subscription_status in {"active", "trialing"}

        if activation_ready:
            vendor.subscription_id = subscription_id
            vendor.subscription_active = True
            vendor.save(update_fields=["subscription_id", "subscription_active"])
            return Response({
                "subscription_active": True,
                "subscription_id": subscription_id,
                "status": subscription_status or session_status,
                "vendor": VendorSerializer(vendor).data,
            })

        vendor.subscription_id = subscription_id
        vendor.save(update_fields=["subscription_id"])
        return Response({
            "subscription_active": False,
            "subscription_id": subscription_id,
            "status": subscription_status or session_status or "pending",
            "vendor": VendorSerializer(vendor).data,
        })


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """Handle Stripe webhook events."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event["type"]

        if event_type == "payment_intent.succeeded":
            self._handle_payment_succeeded(event["data"]["object"])
        elif event_type == "customer.subscription.updated":
            self._handle_subscription_updated(event["data"]["object"])
        elif event_type == "customer.subscription.deleted":
            self._handle_subscription_deleted(event["data"]["object"])


        return Response({"received": True})

    # Existing handlers...
    def _handle_payment_succeeded(self, payment_intent):
        booking_id = payment_intent["metadata"].get("booking_id")
        if not booking_id:
            return
        booking = Booking.objects.filter(pk=booking_id).first()
        if not booking:
            return
        payment, created = Payment.objects.update_or_create(
            stripe_payment_intent_id=payment_intent["id"],
            defaults={
                "booking": booking,
                "amount": payment_intent["amount"] / 100,
                "status": Payment.Status.SUCCEEDED,
            },
        )
        if created or payment.status != Payment.Status.SUCCEEDED:
            booking.status = BookingStatus.ACTIVE
            booking.save(update_fields=["status"])

    def _handle_subscription_updated(self, subscription):
        from apps.equipment.models import Vendor
        vendor = Vendor.objects.filter(subscription_id=subscription["id"]).first()
        if vendor:
            vendor.subscription_active = subscription["status"] in {"active", "trialing"}
            vendor.save(update_fields=["subscription_active"])
            if not vendor.subscription_active:
                deactivate_vendor_listings(vendor)

    def _handle_subscription_deleted(self, subscription):
        from apps.equipment.models import Vendor
        vendor = Vendor.objects.filter(subscription_id=subscription["id"]).first()
        if vendor:
            vendor.subscription_active = False
            vendor.save(update_fields=["subscription_active"])
            deactivate_vendor_listings(vendor)


