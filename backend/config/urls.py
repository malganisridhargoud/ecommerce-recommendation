from django.http import JsonResponse
from django.urls import path, include
from django.contrib import admin
from apps.bookings.views import DisputeListView


def health_check(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),
    path("api/users/", include("apps.users.urls")),
    path("api/equipment/", include("apps.equipment.urls")),
    path("api/bookings/", include("apps.bookings.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/vendors/", include("apps.vendors.urls")),
    path("api/subscriptions/", include("apps.subscriptions.urls")),
    path("api/chat/", include("apps.communications.urls")),
    # Control endpoints
    path("api/control/disputes/", DisputeListView.as_view(), name="control-disputes"),
]
