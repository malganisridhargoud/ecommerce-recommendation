from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.shortcuts import get_object_or_404
from apps.bookings.models import Booking, BookingStatus
from apps.equipment.models import Equipment, Vendor, Review
from apps.payments.models import Payment


class VendorAnalyticsView(APIView):
    """Revenue, booking stats, and top equipment for a vendor."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        bookings = Booking.objects.filter(equipment__vendor=vendor).exclude(
            status=BookingStatus.CANCELLED
        )

        total_revenue = bookings.aggregate(total=Sum("total_price"))["total"] or 0
        total_bookings = bookings.count()
        avg_booking_value = bookings.aggregate(avg=Avg("total_price"))["avg"] or 0

        top_equipment = (
            bookings.values("equipment__id", "equipment__name")
            .annotate(count=Count("id"), revenue=Sum("total_price"))
            .order_by("-revenue")[:5]
        )

        monthly_revenue = (
            bookings.values("start_date__year", "start_date__month")
            .annotate(revenue=Sum("total_price"), count=Count("id"))
            .order_by("start_date__year", "start_date__month")
        )

        return Response({
            "total_revenue": float(total_revenue),
            "total_bookings": total_bookings,
            "avg_booking_value": float(avg_booking_value),
            "top_equipment": list(top_equipment),
            "monthly_revenue": list(monthly_revenue),
        })


class AdminAnalyticsView(APIView):
    """Platform-wide analytics for admins."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # if not request.user.is_admin:
        #     return Response({"error": "Admin only."}, status=403)

        total_revenue = (
            Booking.objects.exclude(status=BookingStatus.CANCELLED)
            .aggregate(total=Sum("total_price"))["total"] or 0
        )
        total_vendors = Vendor.objects.filter(subscription_active=True).count()
        total_equipment = Equipment.objects.filter(is_active=True).count()
        total_bookings = Booking.objects.count()

        bookings_by_category = (
            Booking.objects.exclude(status=BookingStatus.CANCELLED)
            .values("equipment__category")
            .annotate(count=Count("id"), revenue=Sum("total_price"))
            .order_by("-revenue")
        )

        recent_bookings = list(
            Booking.objects.select_related("equipment", "equipment__vendor")
            .order_by("-created_at")
            .values(
                "id",
                "user_id",
                "equipment__name",
                "equipment__vendor__company_name",
                "start_date",
                "end_date",
                "total_price",
                "status",
                "created_at",
            )[:20]
        )

        recent_payments = list(
            Payment.objects.select_related("booking", "booking__equipment")
            .order_by("-created_at")
            .values(
                "id",
                "booking_id",
                "booking__user_id",
                "booking__equipment__name",
                "amount",
                "currency",
                "status",
                "created_at",
            )[:20]
        )

        recent_reviews = list(
            Review.objects.select_related("equipment", "equipment__vendor")
            .order_by("-created_at")
            .values(
                "id",
                "user_id",
                "equipment__name",
                "equipment__vendor__company_name",
                "rating",
                "title",
                "created_at",
            )[:20]
        )

        return Response({
            "platform_revenue": float(total_revenue),
            "active_vendors": total_vendors,
            "active_listings": total_equipment,
            "total_bookings": total_bookings,
            "bookings_by_category": list(bookings_by_category),
            "recent_bookings": recent_bookings,
            "recent_payments": recent_payments,
            "recent_reviews": recent_reviews,
        })
