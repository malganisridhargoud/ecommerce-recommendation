from django.urls import path
from .views import (
    BookingCreateView,
    MyBookingsView,
    BookingDetailView,
    BookingCancelView,
    AvailabilityView,
    VendorBookingsView,
    VendorBookingStatusView,
    CartCheckoutView,
    CartCheckoutConfirmView,
    BookingCompleteView,
    BookingIssueView,
    DisputeListView,
)

urlpatterns = [
    path("create/", BookingCreateView.as_view(), name="booking-create"),
    path("mine/", MyBookingsView.as_view(), name="my-bookings"),
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path("<int:pk>/cancel/", BookingCancelView.as_view(), name="booking-cancel"),
    path("<int:pk>/<str:action>/", VendorBookingStatusView.as_view(), name="vendor-booking-action"),
    path("availability/<int:equipment_id>/", AvailabilityView.as_view(), name="availability"),
    path("vendor/", VendorBookingsView.as_view(), name="vendor-bookings"),
    path("cart/checkout/", CartCheckoutView.as_view(), name="cart-checkout"),
    path("cart/confirm/", CartCheckoutConfirmView.as_view(), name="cart-confirm"),
    path("<int:pk>/complete/", BookingCompleteView.as_view(), name="booking-complete"),
    path("<int:pk>/issue/", BookingIssueView.as_view(), name="booking-issue"),
    path("disputes/", DisputeListView.as_view(), name="dispute-list"),
]
