from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', include('chat.urls')),
]

# Serve temp uploaded files in development
if settings.DEBUG:
    import os
    from django.views.static import serve
    urlpatterns += [
        path('media/temp/<str:room_code>/<str:filename>',
             lambda req, room_code, filename: serve(
                 req, os.path.join(room_code, filename),
                 document_root='/tmp/chatroom'
             )),
    ]
