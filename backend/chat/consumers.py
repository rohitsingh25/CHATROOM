"""
WebSocket consumer for the ephemeral chat room.

Message flow (client → server)
-------------------------------
Client connects → sends {"type":"join","username":"..."}
After join_success, client can send:
  {"type":"chat","content":"..."}
  {"type":"typing","is_typing":true}
  {"type":"file","file_url":"...","file_name":"...","file_type":"..."}
  {"type":"delete_room"}   ← creator only

Server events (server → client)
---------------------------------
  join_success      — sent only to the joining client
  chat              — broadcast to all except sender (no echo)
  file              — broadcast to all except sender
  typing            — broadcast to all except sender
  user_join         — broadcast to all (first-time join only, not rejoins)
  user_leave        — broadcast to all
  room_closed       — broadcast to all when creator deletes or room expires
  error             — sent only to the requesting client
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

        # IMPORTANT: accept() MUST come before close() in Django Channels.
        # Calling close() without accept() sends HTTP 403 (rejected upgrade)
        # instead of a proper WebSocket close frame.
        await self.accept()

        if not validate_room_code(self.room_code):
            await self._send({'type': 'error', 'message': 'Invalid room code.'})
            await self.close(code=4001)
            return

        if not await room_manager.room_exists(self.room_code):
            await self._send({'type': 'room_closed', 'reason': 'expired', 'creator': ''})
            await self.close(code=4004)
            return

        await self._send({'type': 'connection_established', 'room_code': self.room_code})

    async def disconnect(self, close_code):
        if not self.username:
            return

        await rate_limiter.remove(self.channel_name)

        if getattr(self, 'is_admin', False):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info(f"[{self.room_code}] Admin watch connection disconnected")
            return

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
            'chat':        self._handle_chat,
            'typing':      self._handle_typing,
            'file':        self._handle_file,
            'delete_room': self._handle_delete_room,   # creator only
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
        is_admin = data.get('is_admin', False)
        admin_token = data.get('admin_token', '')

        room = await room_manager.get_room(self.room_code)
        if room is None:
            await self._send({'type': 'room_closed', 'reason': 'expired', 'creator': ''})
            await self.close(code=4004)
            return

        # Prepare messages history helper
        def get_history_data():
            messages_data = []
            for msg in room.messages:
                messages_data.append({
                    'id': msg.id,
                    'username': msg.username,
                    'content': msg.content,
                    'message_type': msg.message_type,
                    'timestamp': msg.timestamp,
                    'file_url': msg.file_url,
                    'file_name': msg.file_name,
                    'file_type': msg.file_type,
                })
            return messages_data

        if is_admin:
            if admin_token != "rohit-admin-token-1234":
                await self._send_error('Invalid admin credentials.')
                await self.close(code=4001)
                return

            self.username = "Admin (Spectator)"
            self.is_admin = True
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            usernames = room.get_usernames()
            await self._send({
                'type':         'join_success',
                'username':     self.username,
                'online_count': len(usernames),
                'online_users': usernames,
                'room_code':    self.room_code,
                'is_creator':   False,
                'is_admin':     True,
                'messages':     get_history_data(),
            })
            logger.info(f"[{self.room_code}] Admin connected in watch mode")
            return

        username = (data.get('username') or '').strip()
        ok, err = validate_username(username)
        if not ok:
            await self._send_error(err)
            return

        # Determine creator status (first user to join = creator;
        # if they disconnect and rejoin, username match restores creator role).
        is_creator = room.set_creator_if_first(username)

        # Track rejoins — prior_members remembers everyone who ever joined.
        is_returning = room.mark_member(username)

        success = await room_manager.add_user(self.room_code, self.channel_name, username)
        if not success:
            await self._send_error('Room is full (max 10 users).')
            await self.close(code=4003)
            return

        self.username = username
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        usernames = room.get_usernames()

        await self._send({
            'type':         'join_success',
            'username':     username,
            'online_count': len(usernames),
            'online_users': usernames,
            'room_code':    self.room_code,
            'is_creator':   is_creator,      # frontend uses this for delete button
            'messages':     get_history_data(),
        })

        # Broadcast join event ONLY for first-time joins (not reconnects/rejoins).
        # This prevents duplicate "X joined the room" system messages.
        if not is_returning:
            await self.channel_layer.group_send(self.group_name, {
                'type':         'evt_user_join',
                'username':     username,
                'online_count': len(usernames),
            })

        logger.info(
            f"[{self.room_code}] {username} joined "
            f"(creator={is_creator}, returning={is_returning}, total={len(usernames)})"
        )

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
            'type':         'evt_chat',
            'id':           msg.id,
            'username':     msg.username,
            'content':      msg.content,
            'timestamp':    msg.timestamp,
            'message_type': 'text',
            '_sender':      self.channel_name,  # skip echo to sender
        })

    async def _handle_typing(self, data):
        await self.channel_layer.group_send(self.group_name, {
            'type':      'evt_typing',
            'username':  self.username,
            'is_typing': bool(data.get('is_typing', False)),
            '_sender':   self.channel_name,
        })

    async def _handle_file(self, data):
        file_url  = data.get('file_url', '')
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
            'type':         'evt_file',
            'id':           msg.id,
            'username':     msg.username,
            'file_url':     file_url,
            'file_name':    file_name,
            'file_type':    file_type,
            'message_type': mtype,
            'timestamp':    msg.timestamp,
            '_sender':      self.channel_name,
        })

    async def _handle_delete_room(self, data):
        """
        Creator-only: delete the room immediately.
        Broadcasts room_closed to every connected client first,
        then hard-deletes the room and all its files.
        """
        room = await room_manager.get_room(self.room_code)
        if room is None:
            return  # already gone

        if not room.is_creator(self.username):
            await self._send_error('Only the room creator can delete the room.')
            return

        logger.info(f"[{self.room_code}] Creator {self.username} is deleting the room")

        # Notify every connected client BEFORE deleting
        await self.channel_layer.group_send(self.group_name, {
            'type':    'evt_room_closed',
            'reason':  'deleted_by_creator',
            'creator': self.username,
        })

        # Now wipe the room (files + memory)
        await room_manager.delete_room(self.room_code)

    # ------------------------------------------------------------------
    # Channel-layer event receivers (server → each client)
    # ------------------------------------------------------------------

    async def evt_chat(self, event):
        # Skip echoing back to the original sender (they see it via optimistic update)
        if event.get('_sender') != self.channel_name:
            await self._send({**event, 'type': 'chat'})

    async def evt_file(self, event):
        if event.get('_sender') != self.channel_name:
            await self._send({**event, 'type': 'file'})

    async def evt_typing(self, event):
        if event.get('_sender') != self.channel_name:
            await self._send({
                'type':      'typing',
                'username':  event['username'],
                'is_typing': event['is_typing'],
            })

    async def evt_user_join(self, event):
        await self._send({
            'type':         'user_join',
            'username':     event['username'],
            'online_count': event['online_count'],
        })

    async def evt_user_leave(self, event):
        await self._send({
            'type':         'user_leave',
            'username':     event['username'],
            'online_count': event['online_count'],
        })

    async def evt_room_closed(self, event):
        """Sent to every client when the room is deleted (by creator or expiry)."""
        await self._send({
            'type':    'room_closed',
            'reason':  event.get('reason', 'unknown'),
            'creator': event.get('creator', ''),
        })

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _send(self, data: dict):
        await self.send(text_data=json.dumps(data))

    async def _send_error(self, message: str):
        await self._send({'type': 'error', 'message': message})
