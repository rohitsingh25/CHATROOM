"""Temporary file management — files live in /tmp/chatroom/<room_code>/."""
import asyncio
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
}

MIME_TO_EXT = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'application/pdf': '.pdf', 'text/plain': '.txt',
    'application/zip': '.zip', 'application/x-zip-compressed': '.zip',
}


class FileManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def validate(self, filename: str, size: int, content_type: str) -> list[str]:
        errors = []
        if content_type not in ALLOWED_MIME_TYPES:
            errors.append(f"File type '{content_type}' is not allowed.")
        if size > MAX_FILE_SIZE:
            errors.append("File exceeds the 10 MB maximum size.")
        return errors

    async def save(self, room_code: str, original_name: str,
                   content: bytes, content_type: str) -> str:
        """Store file and return its URL path."""
        room_dir = TEMP_BASE / room_code
        await asyncio.to_thread(room_dir.mkdir, parents=True, exist_ok=True)

        ext = MIME_TO_EXT.get(content_type, Path(original_name).suffix or '.bin')
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = room_dir / unique_name

        def _write():
            file_path.write_bytes(content)

        await asyncio.to_thread(_write)
        return f"/media/temp/{room_code}/{unique_name}"

    async def cleanup_room_files(self, room_code: str):
        room_dir = TEMP_BASE / room_code
        if await asyncio.to_thread(room_dir.exists):
            await asyncio.to_thread(shutil.rmtree, str(room_dir), ignore_errors=True)
            logger.info(f"Deleted temp files for room {room_code}")
