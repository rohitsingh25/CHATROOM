from django.urls import path, include
from django.http import JsonResponse
import os
from django.views.static import serve

# Root health-check — Render pings GET / to verify the service is alive.
# Without this, every ping logs "WARNING Not Found: /".
def _health(request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('', _health),                      # GET / → 200 (Render health check)
    path('api/', include('chat.urls')),
    # Serve temp uploaded files — always active (files live in /tmp/chatroom/)
    path('media/temp/<str:room_code>/<str:filename>',
         lambda req, room_code, filename: serve(
             req, os.path.join(room_code, filename),
             document_root='/tmp/chatroom'
         )),
]
