# ROSY - Chats 💬

A real-time, ephemeral chat application. Create or join temporary rooms — messages and files vanish when everyone leaves. No database, no history.

![Stack](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue?style=flat-square) ![Backend](https://img.shields.io/badge/Backend-Django%204.2%20%2B%20Channels-green?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)

> Room codes are **4 digits** (e.g. `3721`). Rooms auto-expire after 30 minutes of inactivity.

---

## ✨ Features

- 🔐 **Temporary rooms** with unique 6-character codes
- ⚡ **Real-time WebSockets** (Django Channels + ASGI)
- 💬 **Typing indicators** and online user list
- 📎 **File & image uploads** (max 10 MB, auto-deleted on room expiry)
- 😊 **Emoji picker** built-in
- 🖱️ **Drag-and-drop** file upload
- 🧹 **Auto-cleanup** — rooms expire after 30 min of inactivity
- 🚫 **No database** — everything in memory
- 🌙 **Dark glassmorphism UI** with Framer Motion animations

---

## 📁 Project Structure

```
CHAT_ROOM/
├── backend/            # Django + Channels
│   ├── chatroom/       # Django project (settings, asgi, urls)
│   │   └── settings/   # base / development / production
│   ├── chat/           # Main app
│   │   ├── consumers.py      WebSocket consumer
│   │   ├── room_manager.py   In-memory room store
│   │   ├── rate_limiter.py   Token-bucket rate limiter
│   │   ├── file_handler.py   Temp file management
│   │   ├── views.py          REST API
│   │   ├── urls.py
│   │   ├── routing.py        WebSocket URL patterns
│   │   └── validators.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/           # React 18 + Vite
    ├── src/
    │   ├── pages/          Home, CreateRoom, JoinRoom, ChatRoom
    │   ├── components/     Chat/* , Room/*
    │   ├── hooks/          useWebSocket.js
    │   ├── store/          chatStore.js (Zustand)
    │   └── utils/          formatters.js
    ├── vite.config.js
    └── .env.example
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (or use the nvm setup below)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy env and (optionally) edit values
cp .env.example .env

# Start with Daphne (ASGI)
daphne -b 0.0.0.0 -p 8000 chatroom.asgi:application
```

### Frontend

```bash
cd frontend
cp .env.example .env

npm install
npm run dev     # Visit http://localhost:5173
```

---

## 🌐 WebSocket Protocol

| Event | Direction | Fields |
|-------|-----------|--------|
| `join` | C→S | `username` |
| `join_success` | S→C | `username`, `online_count`, `online_users`, `room_code` |
| `chat` | C↔S | `content` |
| `typing` | C↔S | `is_typing` |
| `file` | C↔S | `file_url`, `file_name`, `file_type` |
| `user_join` | S→C | `username`, `online_count` |
| `user_leave` | S→C | `username`, `online_count` |
| `error` | S→C | `message` |

---

## 🔌 REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms/create/` | Create room → returns `room_code` |
| POST | `/api/rooms/join/` | Validate room code |
| POST | `/api/upload/` | Upload file (multipart) |
| GET | `/api/health/` | Health check + active room count |

---

## ⚙️ Environment Variables

### Backend `.env`
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
DJANGO_SETTINGS_MODULE=chatroom.settings.development
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

---

## ☁️ Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy the `dist/` folder to Vercel, or connect the repo
```
Set environment variable:
```
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_WS_BASE_URL=wss://your-backend.onrender.com
```

### Backend → Render
1. Create a new **Web Service** on Render
2. Build command: `pip install -r requirements.txt`
3. Start command: `daphne -b 0.0.0.0 -p $PORT chatroom.asgi:application`
4. Set env vars: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DJANGO_SETTINGS_MODULE=chatroom.settings.production`

> **Note:** For production at scale, add Redis as the Channels layer by installing `channels-redis` and setting `REDIS_URL` in env (see `production.py`).

---

## 🛡️ Security

- Rate limiting: 30 messages/min per WebSocket connection (token bucket)
- File validation: MIME type whitelist + 10 MB max
- Room codes are server-generated (not user-provided)
- CORS configured per environment
- No user data persisted anywhere

---

## 📜 License

MIT
