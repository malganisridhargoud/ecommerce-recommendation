from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
import stripe

from .models import Booking, BookingStatus, CartCheckout
from .serializers import BookingSerializer, BookingCreateSerializer
from .services import (
    create_booking, BookingConflictError, BookingValidationError, 
    get_available_dates, process_booking_cancellation, process_cart_checkout
)
from apps.equipment.models import Equipment, CartItem
from core.subscriptions import vendor_subscription_required

stripe.api_key = settings.STRIPE_SECRET_KEY


def ensure_buyer_role(user, context="API"):
    """Normalizes the user role to buyer for endpoints strictly meant for buyers."""
    from apps.users.models import UserProfile, UserRole
    profile, _ = UserProfile.objects.get_or_create(user_id=user.id, defaults={"role": UserRole.BUYER})
    
    if user.is_vendor or user.is_admin:
        import sys
        print(f"[{context}] ROLE MISMATCH. Resetting {user.id} to buyer.", file=sys.stderr)
        profile.role = UserRole.BUYER
        profile.save(update_fields=["role"])
        user._resolved_role = UserRole.BUYER


class BookingCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ensure_buyer_role(request.user, "BookingCreate")
        if request.user.is_vendor or request.user.is_admin:
            return Response({"error": "Only buyers can create bookings."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        equipment = get_object_or_404(Equipment, pk=data["equipment_id"], is_active=True)
        
        if vendor_subscription_required() and not equipment.vendor.subscription_active:
            return Response({"error": "This listing is unavailable because the vendor subscription is inactive."}, status=status.HTTP_403_FORBIDDEN)

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
            
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user_id=self.request.user.id).select_related("equipment", "equipment__vendor")


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
        
        try:
            result = process_booking_cancellation(booking)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        response_data = {"message": "Booking cancelled successfully."}
        if result["refund_processed"]:
            response_data["refund"] = {"amount": result["refund_amount"], "status": "processed"}
        elif result["refund_error"]:
            response_data["refund"] = {"status": "failed", "error": result["refund_error"]}
            
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
        return Booking.objects.filter(equipment__vendor=vendor).select_related("equipment")


class VendorBookingStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        from apps.equipment.models import Vendor

        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        booking = get_object_or_404(Booking, pk=pk, equipment__vendor=vendor)

        action_map = {
            "confirm": BookingStatus.CONFIRMED,
            "cancel": BookingStatus.CANCELLED,
            "complete": BookingStatus.COMPLETED,
            "ship": BookingStatus.SHIPPED,
            "deliver": BookingStatus.DELIVERED,
        }

        if action not in action_map:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = action_map[action]
        booking.save(update_fields=["status"])
        return Response({"message": f"Booking {action}ed successfully.", "status": booking.status})


class CartCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ensure_buyer_role(request.user, "CartCheckout")
        if request.user.is_vendor or request.user.is_admin:
            return Response({"error": "Only buyers can checkout cart."}, status=status.HTTP_403_FORBIDDEN)

        payment_method = request.data.get("payment_method", Booking.PaymentMethod.STRIPE)
        shipping_address = request.data.get("shipping_address") or {}
        
        if payment_method not in [Booking.PaymentMethod.STRIPE, Booking.PaymentMethod.COD]:
            return Response({"error": "Invalid payment method."}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = list(CartItem.objects.select_related("equipment").filter(user_id=request.user.id, equipment__is_active=True).order_by("-updated_at"))
        if not cart_items:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            checkout, created_bookings, client_secret = process_cart_checkout(request.user.id, cart_items, payment_method, shipping_address)
        except BookingValidationError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except BookingConflictError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_409_CONFLICT)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if payment_method == Booking.PaymentMethod.COD:
            CartItem.objects.filter(id__in=[c.id for c in cart_items]).delete()
            return Response({
                "checkout_id": checkout.id,
                "status": checkout.status,
                "payment_method": payment_method,
                "bookings": BookingSerializer(created_bookings, many=True).data,
                "message": "COD order placed successfully.",
            }, status=status.HTTP_201_CREATED)

        return Response({
            "checkout_id": checkout.id,
            "client_secret": client_secret,
            "status": checkout.status,
            "payment_method": payment_method,
            "bookings": BookingSerializer(created_bookings, many=True).data,
        }, status=status.HTTP_201_CREATED)


class CartCheckoutConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_intent_id = request.data.get("payment_intent_id")
        if not payment_intent_id:
            return Response({"error": "payment_intent_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        checkout = get_object_or_404(CartCheckout, user_id=request.user.id, stripe_payment_intent_id=payment_intent_id)
        
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
        bookings = Booking.objects.filter(id__in=booking_ids, user_id=request.user.id).select_related("equipment", "equipment__vendor")

        return Response({
            "checkout_id": checkout.id,
            "status": checkout.status,
            "payment_method": checkout.payment_method,
            "booking_ids": booking_ids,
            "bookings": BookingSerializer(bookings, many=True).data,
        })


class BookingCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user_id=request.user.id)
        if booking.status not in [BookingStatus.ACTIVE, BookingStatus.DELIVERED]:
            return Response({"error": "Only active or delivered bookings can be completed."}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = BookingStatus.COMPLETED
        booking.save(update_fields=["status"])
        return Response({"message": "Booking marked as completed.", "status": booking.status})


class BookingIssueView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from .models import IssueStatus
        
        booking = get_object_or_404(Booking, pk=pk, user_id=request.user.id)
        issue_text = request.data.get("issue_text", "").strip()
        
        if not issue_text:
            return Response({"error": "Issue text is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.issue_text = issue_text
        booking.issue_status = IssueStatus.OPEN
        booking.save(update_fields=["issue_text", "issue_status"])
        
        return Response({"message": "Issue reported successfully.", "issue_status": booking.issue_status})
