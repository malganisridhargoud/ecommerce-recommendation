from django.http import JsonResponse
from django.urls import path, include
from django.contrib import admin


def health_check(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),
    path("api/users/", include("apps.users.urls")),
    path("api/equipment/", include("apps.equipment.urls")),
    path("api/bookings/", include("apps.bookings.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/vendors/", include("apps.vendors.urls")),
    path("api/chat/", include("apps.communications.urls")),
]
