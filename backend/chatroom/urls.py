from django.urls import path, include
import os
from django.views.static import serve

urlpatterns = [
    path('api/', include('chat.urls')),
    # Serve temp uploaded files — always active (files live in /tmp/chatroom/)
    path('media/temp/<str:room_code>/<str:filename>',
         lambda req, room_code, filename: serve(
             req, os.path.join(room_code, filename),
             document_root='/tmp/chatroom'
         )),
]
