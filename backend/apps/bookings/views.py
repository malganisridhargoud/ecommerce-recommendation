from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.conf import settings
import stripe
from django.utils import timezone as django_timezone
from datetime import timedelta
from .models import Booking, BookingStatus, CartCheckout, Dispute
from .serializers import BookingSerializer, BookingCreateSerializer, DisputeSerializer
from .services import create_booking, BookingConflictError, BookingValidationError, get_available_dates
from apps.equipment.models import Equipment, CartItem
from core.subscriptions import vendor_subscription_required
from .notifications import broadcast_booking_update

stripe.api_key = settings.STRIPE_SECRET_KEY


class BookingCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Normalize user role if accessing buyer endpoint with vendor/admin role
        from apps.users.models import UserProfile, UserRole
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER}
        )
        
        if request.user.is_vendor or request.user.is_admin:
            print(f"[BookingCreate] ROLE MISMATCH: user {request.user.id} is_vendor={request.user.is_vendor}, is_admin={request.user.is_admin}. Resetting to buyer.", file=__import__('sys').stderr)
            profile.role = UserRole.BUYER
            profile.save(update_fields=["role"])
            request.user._resolved_role = UserRole.BUYER
        
        if request.user.is_vendor or request.user.is_admin:
            return Response({"error": "Only buyers can create bookings."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        equipment = get_object_or_404(Equipment, pk=data["equipment_id"], is_active=True)
        if vendor_subscription_required() and not equipment.vendor.subscription_active:
            return Response(
                {"error": "This listing is unavailable because the vendor subscription is inactive."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            booking = create_booking(
                equipment=equipment,
                user_id=request.user.id,
                start_date=data["start_date"],
                end_date=data["end_date"],
                shipping_address=data.get("shipping_address") or {},
                payment_method=data.get("payment_method", Booking.PaymentMethod.STRIPE),
            )
        except BookingConflictError as e:
            return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)
        except BookingValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if data.get("payment_method") == Booking.PaymentMethod.COD:
            booking.status = BookingStatus.PENDING
            booking.save(update_fields=["status"])
        try:
            broadcast_booking_update(booking, actor="buyer", event="booking.created")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Broadcast error for booking {booking.id}: {str(e)}")
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user_id=self.request.user.id).select_related(
            "equipment", "equipment__vendor"
        )


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Booking.objects.select_related("equipment", "equipment__vendor")
        if self.request.user.is_admin:
            return qs
        if self.request.user.is_vendor:
            from apps.equipment.models import Vendor
            vendor = get_object_or_404(Vendor, user_id=self.request.user.id)
            return qs.filter(equipment__vendor=vendor)
        return qs.filter(user_id=self.request.user.id)


class BookingCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user_id=request.user.id)
        if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
            return Response(
                {"error": "Cannot cancel a completed or already cancelled booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Process refund if payment was made via Stripe
        refund_processed = False
        refund_error = None
        
        if booking.payment_method == Booking.PaymentMethod.STRIPE and booking.stripe_payment_intent_id:
            try:
                # Check if payment was actually captured
                payment_intent = stripe.PaymentIntent.retrieve(booking.stripe_payment_intent_id)
                
                if payment_intent.get("status") == "succeeded" and payment_intent.get("amount_received", 0) > 0:
                    # Calculate refund amount based on cancellation policy
                    # Full refund if cancelled more than 24 hours before start
                    now = django_timezone.now().date()
                    start_date = booking.start_date
                    
                    # If cancelled more than 24 hours before start, full refund
                    if start_date > now + timedelta(days=1):
                        refund_amount = int(float(booking.total_price) * 100)  # Convert to cents
                    else:
                        # Within 24 hours - 50% refund
                        refund_amount = int(float(booking.total_price) * 100 * 0.5)
                    
                    # Create refund
                    refund = stripe.Refund.create(
                        payment_intent=booking.stripe_payment_intent_id,
                        amount=refund_amount,
                        reason="requested_by_customer",
                    )
                    
                    booking.refund_amount = refund_amount / 100  # Convert back to decimal
                    booking.refund_status = "processed"
                    booking.refund_processed_at = django_timezone.now()
                    refund_processed = True
                    
            except stripe.error.StripeError as e:
                refund_error = str(e)
                # Continue with cancellation even if refund fails
        
        booking.status = BookingStatus.CANCELLED
        booking.save(update_fields=["status", "refund_amount", "refund_status", "refund_processed_at"])
        try:
            broadcast_booking_update(booking, actor="buyer", event="booking.cancelled")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Broadcast error for booking {booking.id}: {str(e)}")
        
        response_data = {"message": "Booking cancelled successfully."}
        if refund_processed:
            response_data["refund"] = {
                "amount": booking.refund_amount,
                "status": "processed"
            }
        elif refund_error:
            response_data["refund"] = {
                "status": "failed",
                "error": refund_error
            }
        
        return Response(response_data)


class AvailabilityView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, equipment_id):
        equipment = get_object_or_404(Equipment, pk=equipment_id)
        month = int(request.query_params.get("month", 1))
        year = int(request.query_params.get("year", 2025))
        unavailable = get_available_dates(equipment, month, year)
        return Response({"unavailable_ranges": unavailable})


class VendorBookingsView(generics.ListAPIView):
    """Vendor views bookings for their own equipment."""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from apps.equipment.models import Vendor
        vendor = get_object_or_404(Vendor, user_id=self.request.user.id)
        return Booking.objects.filter(
            equipment__vendor=vendor
        ).select_related("equipment")


class VendorBookingStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        from apps.equipment.models import Vendor

        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        booking = get_object_or_404(Booking, pk=pk, equipment__vendor=vendor)

        if action == "confirm":
            booking.status = BookingStatus.CONFIRMED
        elif action == "cancel":
            booking.status = BookingStatus.CANCELLED
        elif action == "complete":
            booking.status = BookingStatus.COMPLETED
        elif action == "ship":
            booking.status = BookingStatus.SHIPPED
        elif action == "deliver":
            booking.status = BookingStatus.DELIVERED
        else:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        booking.save(update_fields=["status"])
        try:
            broadcast_booking_update(booking, actor="vendor", event=f"booking.{booking.status}")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Broadcast error for booking {booking.id}: {str(e)}")
        return Response({"message": f"Booking {action}ed successfully.", "status": booking.status})


class CartCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        # Ensure user profile exists and normalize role for buyer context
        from apps.users.models import UserProfile, UserRole
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER}
        )
        
        # Normalize: if user is accessing buyer endpoint, allow it
        # (they may have accidentally been set to vendor in db)
        # Check if they're trying to use pure buyer features
        has_cart = CartItem.objects.filter(user_id=request.user.id).exists()
        
        # Debug log
        import sys
        print(f"[CartCheckout] user={request.user.id}, profile.role={profile.role}, has_cart={has_cart}, is_vendor={request.user.is_vendor}, is_admin={request.user.is_admin}", file=sys.stderr)
        
        # If user has cart items or is explicitly accessing buyer endpoint with vendor role,
        # this is a role mismatch - they should be buyer
        if has_cart and (request.user.is_vendor or request.user.is_admin):
            print(f"[CartCheckout] ROLE MISMATCH: user {request.user.id} has cart but is_vendor={request.user.is_vendor}, is_admin={request.user.is_admin}. Resetting role to buyer.", file=sys.stderr)
            profile.role = UserRole.BUYER
            profile.save(update_fields=["role"])
            # Force re-resolution of role
            request.user._resolved_role = UserRole.BUYER
        
        if request.user.is_vendor or request.user.is_admin:
            return Response({"error": "Only buyers can checkout cart."}, status=status.HTTP_403_FORBIDDEN)

        payment_method = request.data.get("payment_method", Booking.PaymentMethod.STRIPE)
        if payment_method not in [Booking.PaymentMethod.STRIPE, Booking.PaymentMethod.COD]:
            return Response({"error": "Invalid payment method."}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = list(
            CartItem.objects.select_related("equipment")
            .filter(user_id=request.user.id, equipment__is_active=True)
            .order_by("-updated_at")
        )
        if not cart_items:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        created_bookings = []
        total = 0
        for item in cart_items:
            if vendor_subscription_required() and not item.equipment.vendor.subscription_active:
                return Response(
                    {"error": f"{item.equipment.name}: vendor subscription is inactive."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            try:
                booking = create_booking(
                    equipment=item.equipment,
                    user_id=request.user.id,
                    start_date=item.start_date,
                    end_date=item.end_date,
                    payment_method=payment_method,
                )
                if payment_method == Booking.PaymentMethod.COD:
                    booking.status = BookingStatus.PENDING
                    booking.save(update_fields=["status"])
                created_bookings.append(booking)
                total += float(booking.total_price)
            except (BookingConflictError, BookingValidationError) as exc:
                return Response({"error": f"{item.equipment.name}: {exc}"}, status=status.HTTP_409_CONFLICT)

        checkout = CartCheckout.objects.create(
            user_id=request.user.id,
            booking_ids=[b.id for b in created_bookings],
            total_amount=total,
            payment_method=payment_method,
            status=CartCheckout.Status.PAID if payment_method == Booking.PaymentMethod.COD else CartCheckout.Status.PENDING,
        )

        if payment_method == Booking.PaymentMethod.COD:
            CartItem.objects.filter(id__in=[c.id for c in cart_items]).delete()
            for booking in created_bookings:
                try:
                    broadcast_booking_update(booking, actor="buyer", event="booking.created")
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Broadcast error for booking {booking.id}: {str(e)}")
            return Response(
                {
                    "checkout_id": checkout.id,
                    "status": checkout.status,
                    "bookings": BookingSerializer(created_bookings, many=True).data,
                    "message": "COD order placed successfully.",
                },
                status=status.HTTP_201_CREATED,
            )

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(total * 100),
                currency=settings.STRIPE_CURRENCY,
                metadata={
                    "checkout_id": checkout.id,
                    "user_id": request.user.id,
                    "booking_ids": ",".join(str(b.id) for b in created_bookings),
                },
            )
            checkout.stripe_payment_intent_id = intent["id"]
            checkout.save(update_fields=["stripe_payment_intent_id"])
            return Response(
                {
                    "checkout_id": checkout.id,
                    "client_secret": intent["client_secret"],
                    "status": checkout.status,
                    "bookings": BookingSerializer(created_bookings, many=True).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except stripe.error.StripeError as exc:
            Booking.objects.filter(id__in=[b.id for b in created_bookings], user_id=request.user.id).update(
                status=BookingStatus.CANCELLED
            )
            checkout.status = CartCheckout.Status.FAILED
            checkout.save(update_fields=["status"])
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CartCheckoutConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_intent_id = request.data.get("payment_intent_id")
        if not payment_intent_id:
            return Response({"error": "payment_intent_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        checkout = get_object_or_404(
            CartCheckout,
            user_id=request.user.id,
            stripe_payment_intent_id=payment_intent_id,
        )
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if intent.get("status") != "succeeded":
            return Response({"error": "Payment not completed yet."}, status=status.HTTP_400_BAD_REQUEST)

        booking_ids = checkout.booking_ids or []
        Booking.objects.filter(id__in=booking_ids, user_id=request.user.id).update(status=BookingStatus.ACTIVE)
        checkout.status = CartCheckout.Status.PAID
        checkout.save(update_fields=["status"])
        CartItem.objects.filter(user_id=request.user.id).delete()

        return Response({"status": checkout.status, "booking_ids": booking_ids})


class BookingCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user_id=request.user.id)
        if booking.status not in [BookingStatus.ACTIVE, BookingStatus.DELIVERED]:
            return Response({"error": "Only active or delivered bookings can be completed."}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = BookingStatus.COMPLETED
        booking.save(update_fields=["status"])
        try:
            broadcast_booking_update(booking, actor="buyer", event="booking.completed")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Broadcast error for booking {booking.id}: {str(e)}")
        return Response({"message": "Booking marked as completed.", "status": booking.status})


class BookingIssueView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user_id=request.user.id)
        issue_text = request.data.get("issue_text", "").strip()
        
        if not issue_text:
            return Response({"error": "Issue text is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        from .models import IssueStatus
        booking.issue_text = issue_text
        booking.issue_status = IssueStatus.OPEN
        booking.save(update_fields=["issue_text", "issue_status"])
        try:
            broadcast_booking_update(booking, actor="buyer", event="booking.issue_reported")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Broadcast error for booking {booking.id}: {str(e)}")
        
        return Response({"message": "Issue reported successfully.", "issue_status": booking.issue_status})


class DisputeListView(APIView):
    """List and create disputes"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List disputes - accessible to admins only"""
        if request.user.is_admin:
            disputes = Dispute.objects.select_related("booking", "booking__equipment").all()
        else:
            # Regular users can only see their own disputes
            disputes = Dispute.objects.filter(booking__user_id=request.user.id).select_related("booking", "booking__equipment")
        
        serializer = DisputeSerializer(disputes, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a dispute for a booking"""
        booking_id = request.data.get("booking")
        if not booking_id:
            return Response({"error": "booking is required."}, status=status.HTTP_400_BAD_REQUEST)

        booking = get_object_or_404(Booking, pk=booking_id, user_id=request.user.id)

        reason = request.data.get("reason", "other")
        description = request.data.get("description", "").strip()
        evidence_url = request.data.get("evidence_url", "").strip()

        if not description:
            return Response({"error": "description is required."}, status=status.HTTP_400_BAD_REQUEST)

        dispute, created = Dispute.objects.get_or_create(
            booking=booking,
            defaults={
                "reason": reason,
                "description": description,
                "evidence_url": evidence_url,
                "status": Dispute.Status.OPEN,
            }
        )

        if not created:
            return Response({"error": "A dispute already exists for this booking."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)
