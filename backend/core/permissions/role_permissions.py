from rest_framework.permissions import BasePermission


class IsVendor(BasePermission):
    """Allow access only to vendors with active subscriptions."""

    message = "Vendor subscription required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        from apps.equipment.models import Vendor
        vendor = Vendor.objects.filter(user_id=request.user.id).first()
        if not vendor:
            return False
        return vendor.subscription_active


class IsAdminUser(BasePermission):
    """Allow access only to admin users."""

    message = "Admin privileges required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_admin


class IsVendorOrAdmin(BasePermission):
    """Allow access to vendors or admins."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_vendor or request.user.is_admin