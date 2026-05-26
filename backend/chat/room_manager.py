"""
In-memory room manager. No data is persisted to any database.
Rooms expire after ROOM_INACTIVITY_TIMEOUT seconds of inactivity,
or immediately when all users disconnect.
"""
import asyncio
import uuid
import logging
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

ROOM_INACTIVITY_TIMEOUT = 30 * 60   # 30 minutes
MAX_USERS_PER_ROOM = 10
MAX_MESSAGES_IN_MEMORY = 100
CLEANUP_INTERVAL = 60                # seconds between cleanup sweeps


@dataclass
class Message:
    id: str
    username: str
    content: str
    message_type: str           # 'text' | 'image' | 'file'
    timestamp: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None


@dataclass
class Room:
    code: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_active: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    users: Dict[str, str] = field(default_factory=dict)   # channel_name -> username
    messages: List[Message] = field(default_factory=list)

    def touch(self):
        self.last_active = datetime.now(timezone.utc)

    def is_expired(self) -> bool:
        elapsed = (datetime.now(timezone.utc) - self.last_active).total_seconds()
        return elapsed > ROOM_INACTIVITY_TIMEOUT

    def add_user(self, channel_name: str, username: str) -> bool:
        if len(self.users) >= MAX_USERS_PER_ROOM:
            return False
        self.users[channel_name] = username
        self.touch()
        return True

    def remove_user(self, channel_name: str) -> Optional[str]:
        username = self.users.pop(channel_name, None)
        self.touch()
        return username

    def add_message(self, message: Message):
        self.messages.append(message)
        if len(self.messages) > MAX_MESSAGES_IN_MEMORY:
            self.messages = self.messages[-MAX_MESSAGES_IN_MEMORY:]
        self.touch()

    def get_online_count(self) -> int:
        return len(self.users)

    def get_usernames(self) -> List[str]:
        return list(self.users.values())


class RoomManager:
    """Singleton in-memory store for all active chat rooms."""

    _instance: Optional['RoomManager'] = None

    def __new__(cls):
        if cls._instance is None:
            inst = super().__new__(cls)
            inst._rooms: Dict[str, Room] = {}
            inst._lock = asyncio.Lock()
            inst._cleanup_task: Optional[asyncio.Task] = None
            cls._instance = inst
        return cls._instance

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def _ensure_cleanup_running(self):
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        while True:
            await asyncio.sleep(CLEANUP_INTERVAL)
            await self._sweep_expired_rooms()

    async def _sweep_expired_rooms(self):
        async with self._lock:
            expired = [c for c, r in self._rooms.items() if r.is_expired()]
        for code in expired:
            logger.info(f"Auto-deleting expired room: {code}")
            await self._delete_room_files(code)
            async with self._lock:
                self._rooms.pop(code, None)

    async def _delete_room_files(self, code: str):
        try:
            from .file_handler import FileManager
            await FileManager().cleanup_room_files(code)
        except Exception as exc:
            logger.warning(f"File cleanup failed for room {code}: {exc}")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def create_room(self, code: str) -> Room:
        async with self._lock:
            room = Room(code=code)
            self._rooms[code] = room
        await self._ensure_cleanup_running()
        logger.info(f"Room created: {code}")
        return room

    async def get_room(self, code: str) -> Optional[Room]:
        async with self._lock:
            return self._rooms.get(code)

    async def room_exists(self, code: str) -> bool:
        async with self._lock:
            return code in self._rooms

    async def delete_room(self, code: str):
        async with self._lock:
            self._rooms.pop(code, None)
        await self._delete_room_files(code)
        logger.info(f"Room deleted: {code}")

    async def add_user(self, code: str, channel_name: str, username: str) -> bool:
        room = await self.get_room(code)
        if room is None:
            return False
        return room.add_user(channel_name, username)

    async def remove_user(self, code: str, channel_name: str):
        """Returns (username, remaining_count). Deletes room if empty."""
        room = await self.get_room(code)
        if room is None:
            return None, 0
        username = room.remove_user(channel_name)
        remaining = room.get_online_count()
        if remaining == 0:
            await self.delete_room(code)
        return username, remaining

    async def add_message(self, code: str, message: Message):
        room = await self.get_room(code)
        if room:
            room.add_message(message)

    async def active_room_count(self) -> int:
        async with self._lock:
            return len(self._rooms)


# Module-level singleton
room_manager = RoomManager()
