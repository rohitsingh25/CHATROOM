import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chatroom.settings.development')

# Initialize Django ASGI app early to ensure the app registry is populated
django_asgi_app = get_asgi_application()

from chat.routing import websocket_urlpatterns  # noqa: E402

# NOTE: We use a plain URLRouter (no AllowedHostsOriginValidator) because the
# frontend origin (rosychats.vercel.app) differs from the backend host
# (rosychats-backend.onrender.com). AllowedHostsOriginValidator checks that the
# WS Origin header is in ALLOWED_HOSTS, which would reject every browser
# connection. HTTP-level CORS is already enforced by django-cors-headers.
application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': URLRouter(websocket_urlpatterns),
})
