from django.urls import re_path

from .consumers import EquipmentUpdatesConsumer


websocket_urlpatterns = [
    re_path(r"ws/equipment/updates/$", EquipmentUpdatesConsumer.as_asgi()),
]