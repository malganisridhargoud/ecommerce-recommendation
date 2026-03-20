from django.conf import settings
from rest_framework.exceptions import PermissionDenied


def vendor_subscription_required():
    return getattr(settings, "REQUIRE_VENDOR_SUBSCRIPTION", False)


def ensure_vendor_can_list(vendor, *, action="list equipment"):
    if vendor_subscription_required() and not vendor.subscription_active:
        raise PermissionDenied(f"Active subscription required to {action}.")


def deactivate_vendor_listings(vendor):
    if not vendor:
        return 0
    return vendor.equipment_list.filter(is_active=True).update(is_active=False)
