from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<room_code>[0-9]{4})/$', consumers.ChatConsumer.as_asgi()),
]
