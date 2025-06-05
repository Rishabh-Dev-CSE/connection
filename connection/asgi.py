import os
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import connectionapp.routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "connection.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            connectionapp.routing.websocket_urlpatterns
        )
    ),
})
