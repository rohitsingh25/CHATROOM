"""Temporary file management — files live in /tmp/chatroom/<room_code>/."""
import asyncio
import os
import shutil
import uuid
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

TEMP_BASE = Path('/tmp/chatroom')
MAX_FILE_SIZE = 10 * 1024 * 1024   # 10 MB

ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain',
    'application/zip', 'application/x-zip-compressed',
    'application/octet-stream',
}

MIME_TO_EXT = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'application/pdf': '.pdf', 'text/plain': '.txt',
    'application/zip': '.zip', 'application/x-zip-compressed': '.zip',
}


def _get_backend_base() -> str:
    """
    Return the absolute base URL for the backend.
    Reads BACKEND_BASE_URL env var first (set this on Render).
    Falls back to empty string so relative URLs work in local dev.
    """
    return os.environ.get('BACKEND_BASE_URL', '').rstrip('/')


class FileManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def validate(self, filename: str, size: int, content_type: str) -> list[str]:
        errors = []
        # Be lenient with content-type — check by extension as fallback
        ext = Path(filename).suffix.lower()
        image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        allowed_exts = image_exts | {'.pdf', '.txt', '.zip'}
        if content_type not in ALLOWED_MIME_TYPES and ext not in allowed_exts:
            errors.append(f"File type '{content_type}' is not allowed.")
        if size > MAX_FILE_SIZE:
            errors.append("File exceeds the 10 MB maximum size.")
        return errors

    async def save(self, room_code: str, original_name: str,
                   content: bytes, content_type: str) -> str:
        """Store file and return its absolute URL."""
        room_dir = TEMP_BASE / room_code
        await asyncio.to_thread(room_dir.mkdir, parents=True, exist_ok=True)

        ext = MIME_TO_EXT.get(content_type, Path(original_name).suffix or '.bin')
        # Preserve original filename prefix for readability in downloads
        safe_stem = Path(original_name).stem[:40].replace(' ', '_')
        unique_name = f"{safe_stem}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = room_dir / unique_name

        def _write():
            file_path.write_bytes(content)

        await asyncio.to_thread(_write)

        # Return absolute URL — the frontend is on Vercel and needs the full
        # Render backend URL to load images and trigger downloads.
        base = _get_backend_base()
        return f"{base}/media/temp/{room_code}/{unique_name}"

    async def cleanup_room_files(self, room_code: str):
        room_dir = TEMP_BASE / room_code
        if await asyncio.to_thread(room_dir.exists):
            await asyncio.to_thread(shutil.rmtree, str(room_dir), ignore_errors=True)
            logger.info(f"Deleted temp files for room {room_code}")
