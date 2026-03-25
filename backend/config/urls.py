from django.http import JsonResponse
from django.urls import path, include
from django.contrib import admin


def health_check(_request):
    from django.db import connections
    from django.db.utils import OperationalError
    db_conn = connections['default']
    try:
        db_conn.cursor()
    except OperationalError as e:
        return JsonResponse({"status": "error", "message": f"Database connection failed: {str(e)}"}, status=500)
    return JsonResponse({"status": "ok", "database": "connected"})

urlpatterns = [
    path("", health_check, name="root-status"),
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),
    path("api/users/", include("apps.users.urls")),
    path("api/equipment/", include("apps.equipment.urls")),
    path("api/bookings/", include("apps.bookings.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/vendors/", include("apps.vendors.urls")),
    path("api/subscriptions/", include("apps.subscriptions.urls")),
    path("api/chat/", include("apps.communications.urls")),
    path("api/control/", include("apps.control.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
]
