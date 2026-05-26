"""REST API views."""
import json
import logging
import os
import random

from asgiref.sync import async_to_sync
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .file_handler import FileManager
from .room_manager import room_manager
from .validators import validate_room_code

logger = logging.getLogger(__name__)
file_manager = FileManager()


def _json_body(request) -> tuple[dict, str | None]:
    try:
        return json.loads(request.body), None
    except (json.JSONDecodeError, ValueError):
        return {}, 'Invalid JSON body.'


def _generate_code() -> str:
    """Generate a random 4-digit numeric code, zero-padded (e.g. '0473')."""
    return f"{random.randint(0, 9999):04d}"


@method_decorator(csrf_exempt, name='dispatch')
class CreateRoomView(View):
    def post(self, request):
        for _ in range(10):
            code = _generate_code()
            if not async_to_sync(room_manager.room_exists)(code):
                break
        else:
            return JsonResponse({'error': 'Could not generate a unique room code.'}, status=500)

        async_to_sync(room_manager.create_room)(code)
        logger.info(f"REST: created room {code}")
        return JsonResponse({'room_code': code, 'message': 'Room created.'}, status=201)


@method_decorator(csrf_exempt, name='dispatch')
class JoinRoomView(View):
    def post(self, request):
        body, err = _json_body(request)
        if err:
            return JsonResponse({'error': err}, status=400)

        code = (body.get('room_code') or '').strip()
        if not validate_room_code(code):
            return JsonResponse({'error': 'Invalid room code format.'}, status=400)

        if not async_to_sync(room_manager.room_exists)(code):
            return JsonResponse({'error': 'Room not found or has expired.'}, status=404)

        return JsonResponse({'room_code': code, 'message': 'Room found.'})


@method_decorator(csrf_exempt, name='dispatch')
class FileUploadView(View):
    def post(self, request):
        room_code = (request.POST.get('room_code') or '').strip()
        if not validate_room_code(room_code):
            return JsonResponse({'error': 'Invalid room code.'}, status=400)

        if not async_to_sync(room_manager.room_exists)(room_code):
            return JsonResponse({'error': 'Room not found.'}, status=404)

        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No file provided.'}, status=400)

        f = request.FILES['file']
        errors = file_manager.validate(f.name, f.size, f.content_type)
        if errors:
            return JsonResponse({'error': errors[0]}, status=400)

        content = f.read()
        file_url = async_to_sync(file_manager.save)(room_code, f.name, content, f.content_type)

        return JsonResponse({
            'file_url': file_url,
            'file_name': f.name,
            'file_type': f.content_type,
        }, status=201)


class HealthView(View):
    def get(self, request):
        count = async_to_sync(room_manager.active_room_count)()
        return JsonResponse({'status': 'ok', 'active_rooms': count})
