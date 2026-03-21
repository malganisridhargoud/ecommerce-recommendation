from django.http import JsonResponse
from django.urls import resolve
from apps.equipment.models import Vendor
from .models import VendorSubscription

class SubscriptionEnforcementMiddleware:
    """
    Middleware to enforce subscription limits (e.g., max listings).
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # We only care about authenticated vendors trying to create equipment
        if request.user.is_authenticated and request.method == "POST":
            # Check if this is the equipment creation endpoint
            # Note: You might want to use namespaced URLs if available
            path_info = request.path_info
            if "/api/equipment/create/" in path_info or "/api/equipment/seed-sample/" in path_info:
                vendor = Vendor.objects.filter(user_id=request.user.id).first()
                if vendor:
                    subscription = getattr(vendor, 'subscription', None)
                    if not subscription or not subscription.can_create_listing():
                        return JsonResponse(
                            {"error": "Subscription limit reached. Please upgrade your plan to add more equipment."},
                            status=403
                        )

        response = self.get_response(request)
        return response
