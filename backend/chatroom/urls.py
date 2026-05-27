from django.urls import path, include
from django.http import JsonResponse, FileResponse, HttpResponse
import os
import mimetypes
from pathlib import Path

TEMP_BASE = Path('/tmp/chatroom')


def _health(request):
    """Root health-check — Render pings GET / to verify the service is alive."""
    return JsonResponse({'status': 'ok'})


def _serve_temp_file(request, room_code, filename):
    """
    Serve uploaded temp files with:
    - Content-Disposition: attachment  →  forces browser download, not tab-open
    - Access-Control-Allow-Origin: *   →  allows frontend (Vercel) to fetch the blob
    """
    # Security: prevent path traversal
    if '..' in room_code or '..' in filename or '/' in filename or '/' in room_code:
        return HttpResponse('Forbidden', status=403)

    file_path = TEMP_BASE / room_code / filename
    if not file_path.exists():
        return HttpResponse('Not found', status=404)

    content_type, _ = mimetypes.guess_type(str(file_path))
    content_type = content_type or 'application/octet-stream'

    response = FileResponse(open(file_path, 'rb'), content_type=content_type)
    # Force download (not inline preview) in all browsers
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    # Allow cross-origin fetch so the Vercel frontend can download as blob
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


urlpatterns = [
    path('', _health),
    path('api/', include('chat.urls')),
    path('media/temp/<str:room_code>/<str:filename>', _serve_temp_file),
]
