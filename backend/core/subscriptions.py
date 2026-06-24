from django.conf import settings
from rest_framework.exceptions import PermissionDenied


def vendor_subscription_required():
    return getattr(settings, "REQUIRE_VENDOR_SUBSCRIPTION", False)


def ensure_vendor_can_list(vendor, *, action="list equipment"):
    if vendor_subscription_required() and not vendor.subscription_active:
        active_count = vendor.equipment_list.filter(is_active=True).count()
        if active_count >= 3:
            raise PermissionDenied(f"Free vendors can only have 3 active listings. Upgrade to Growth Plan for unlimited listings.")


def deactivate_vendor_listings(vendor):
    if not vendor:
        return 0
    active_equipment = vendor.equipment_list.filter(is_active=True).order_by('-created_at')
    if active_equipment.count() <= 3:
        return 0
    ids_to_keep = list(active_equipment.values_list('id', flat=True)[:3])
    return vendor.equipment_list.filter(is_active=True).exclude(id__in=ids_to_keep).update(is_active=False)
