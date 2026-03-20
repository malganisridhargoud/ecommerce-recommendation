from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

from .serializers import BookingSerializer


def vendor_booking_group(user_id):
    return f"vendor-bookings-{user_id}"


def buyer_booking_group(user_id):
    return f"buyer-bookings-{user_id}"


def broadcast_booking_update(booking, *, actor="system", event="booking.updated"):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    payload = {
        "type": "booking.event",
        "event": event,
        "actor": actor,
        "timestamp": timezone.now().isoformat(),
        "booking": BookingSerializer(booking).data,
    }

    async_to_sync(channel_layer.group_send)(vendor_booking_group(booking.equipment.vendor.user_id), payload)
    async_to_sync(channel_layer.group_send)(buyer_booking_group(booking.user_id), payload)
