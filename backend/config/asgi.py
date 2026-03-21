import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from apps.bookings.routing import websocket_urlpatterns as booking_websocket_urlpatterns
from apps.equipment.routing import websocket_urlpatterns as equipment_websocket_urlpatterns
from core.authentication.websocket_auth import ClerkAuthMiddlewareStack

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": ClerkAuthMiddlewareStack(URLRouter(booking_websocket_urlpatterns + equipment_websocket_urlpatterns)),
    }
)
