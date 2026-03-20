from django.urls import re_path

from .consumers import BookingEventsConsumer


websocket_urlpatterns = [
    re_path(r"ws/bookings/(?P<role>vendor|buyer)/(?P<user_id>[^/]+)/$", BookingEventsConsumer.as_asgi()),
]
