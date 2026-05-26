"""
WebSocket consumer for the ephemeral chat room.

Message flow
------------
Client connects → sends {"type":"join","username":"..."}
After join_success, client can send:
  {"type":"chat","content":"..."}
  {"type":"typing","is_typing":true}
  {"type":"file","file_url":"...","file_name":"...","file_type":"..."}
"""
import json
import uuid
import logging
from datetime import datetime, timezone

from channels.generic.websocket import AsyncWebsocketConsumer

from .room_manager import room_manager, Message
from .rate_limiter import rate_limiter
from .validators import validate_room_code, validate_username

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self):
        self.room_code: str = self.scope['url_route']['kwargs']['room_code']
        self.group_name: str = f'chat_{self.room_code}'
        self.username: str | None = None

        if not validate_room_code(self.room_code):
            await self.close(code=4001)
            return

        if not await room_manager.room_exists(self.room_code):
            await self.close(code=4004)
            return

        await self.accept()
        await self._send({'type': 'connection_established', 'room_code': self.room_code})

    async def disconnect(self, close_code):
        if not self.username:
            return

        await rate_limiter.remove(self.channel_name)

        username, remaining = await room_manager.remove_user(
            self.room_code, self.channel_name
        )

        if remaining > 0:
            await self.channel_layer.group_send(self.group_name, {
                'type': 'evt_user_leave',
                'username': username,
                'online_count': remaining,
            })

        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"[{self.room_code}] {username} disconnected (remaining={remaining})")

    # ------------------------------------------------------------------
    # Receive & route
    # ------------------------------------------------------------------

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, ValueError):
            await self._send_error('Invalid JSON payload.')
            return

        msg_type = data.get('type')

        if msg_type == 'join':
            await self._handle_join(data)
            return

        if not self.username:
            await self._send_error('You must join the room first.')
            return

        if not await rate_limiter.is_allowed(self.channel_name):
            await self._send_error('Rate limit exceeded — slow down a bit.')
            return

        handlers = {
            'chat': self._handle_chat,
            'typing': self._handle_typing,
            'file': self._handle_file,
        }
        handler = handlers.get(msg_type)
        if handler:
            await handler(data)
        else:
            await self._send_error(f'Unknown message type: {msg_type}')

    # ------------------------------------------------------------------
    # Message handlers (client → server)
    # ------------------------------------------------------------------

    async def _handle_join(self, data):
        username = (data.get('username') or '').strip()
        ok, err = validate_username(username)
        if not ok:
            await self._send_error(err)
            return

        success = await room_manager.add_user(self.room_code, self.channel_name, username)
        if not success:
            await self._send_error('Room is full (max 10 users).')
            await self.close(code=4003)
            return

        self.username = username
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        room = await room_manager.get_room(self.room_code)
        usernames = room.get_usernames() if room else [username]

        await self._send({
            'type': 'join_success',
            'username': username,
            'online_count': len(usernames),
            'online_users': usernames,
            'room_code': self.room_code,
        })

        await self.channel_layer.group_send(self.group_name, {
            'type': 'evt_user_join',
            'username': username,
            'online_count': len(usernames),
        })
        logger.info(f"[{self.room_code}] {username} joined (total={len(usernames)})")

    async def _handle_chat(self, data):
        content = (data.get('content') or '').strip()
        if not content:
            return
        if len(content) > 2000:
            await self._send_error('Message too long (max 2000 characters).')
            return

        msg = Message(
            id=str(uuid.uuid4()),
            username=self.username,
            content=content,
            message_type='text',
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        await room_manager.add_message(self.room_code, msg)
        await self.channel_layer.group_send(self.group_name, {
            'type': 'evt_chat',
            'id': msg.id,
            'username': msg.username,
            'content': msg.content,
            'timestamp': msg.timestamp,
            'message_type': 'text',
        })

    async def _handle_typing(self, data):
        await self.channel_layer.group_send(self.group_name, {
            'type': 'evt_typing',
            'username': self.username,
            'is_typing': bool(data.get('is_typing', False)),
            '_sender': self.channel_name,
        })

    async def _handle_file(self, data):
        file_url = data.get('file_url', '')
        file_name = data.get('file_name', '')
        file_type = data.get('file_type', '')

        if not file_url:
            await self._send_error('Missing file_url.')
            return

        mtype = 'image' if file_type.startswith('image/') else 'file'
        msg = Message(
            id=str(uuid.uuid4()),
            username=self.username,
            content='',
            message_type=mtype,
            timestamp=datetime.now(timezone.utc).isoformat(),
            file_url=file_url,
            file_name=file_name,
            file_type=file_type,
        )
        await room_manager.add_message(self.room_code, msg)
        await self.channel_layer.group_send(self.group_name, {
            'type': 'evt_file',
            'id': msg.id,
            'username': msg.username,
            'file_url': file_url,
            'file_name': file_name,
            'file_type': file_type,
            'message_type': mtype,
            'timestamp': msg.timestamp,
        })

    # ------------------------------------------------------------------
    # Channel-layer event receivers (server → each client)
    # ------------------------------------------------------------------

    async def evt_chat(self, event):
        await self._send({**event, 'type': 'chat'})

    async def evt_file(self, event):
        await self._send({**event, 'type': 'file'})

    async def evt_typing(self, event):
        if event.get('_sender') != self.channel_name:
            await self._send({
                'type': 'typing',
                'username': event['username'],
                'is_typing': event['is_typing'],
            })

    async def evt_user_join(self, event):
        await self._send({
            'type': 'user_join',
            'username': event['username'],
            'online_count': event['online_count'],
        })

    async def evt_user_leave(self, event):
        await self._send({
            'type': 'user_leave',
            'username': event['username'],
            'online_count': event['online_count'],
        })

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _send(self, data: dict):
        await self.send(text_data=json.dumps(data))

    async def _send_error(self, message: str):
        await self._send({'type': 'error', 'message': message})
