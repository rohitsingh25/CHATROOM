# 🌐 Free Hosting Guide for ROSY - Chats

> Host the frontend on **Vercel** (free) and the backend on **Render** (free tier).  
> Total cost: **$0/month** for personal/low-traffic use.

---

## Overview

| Service | What it hosts | Free tier limits |
|---------|--------------|-----------------|
| [Vercel](https://vercel.com) | React frontend | Unlimited deploys, 100 GB bandwidth/mo |
| [Render](https://render.com) | Django backend | 750 hrs/mo, spins down after 15 min inactivity |
| [GitHub](https://github.com) | Source code (required) | Free for public/private repos |

---

## Step 0 — Push code to GitHub

If you haven't already:

```bash
cd /home/rohit/Desktop/CHAT_ROOM
git init
git add .
git commit -m "Initial commit — ROSY - Chats"
```

Then create a new repo at https://github.com/new and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/rosy-chats.git
git branch -M main
git push -u origin main
```

---

## Step 1 — Deploy Backend on Render

### 1.1 Create a free Render account
Go to → https://render.com and sign up (use GitHub login for easy access).

### 1.2 Create a new Web Service
1. Click **New → Web Service**
2. Connect your GitHub repo
3. Select the `backend/` folder (or set the root directory to `backend`)

### 1.3 Configure the service

| Setting | Value |
|---------|-------|
| **Name** | `rosy-chats-backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `daphne -b 0.0.0.0 -p $PORT chatroom.asgi:application` |
| **Instance Type** | Free |

### 1.4 Set Environment Variables
In the **Environment** tab, add:

```
SECRET_KEY          = <generate a random 50-char string>
DEBUG               = False
DJANGO_SETTINGS_MODULE = chatroom.settings.production
ALLOWED_HOSTS       = your-service-name.onrender.com
CORS_ALLOWED_ORIGINS = https://your-frontend.vercel.app
```

> **Generate a secret key:**
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

### 1.5 Deploy
Click **Create Web Service**. Render will build and start the server.  
Your backend URL will be: `https://rosy-chats-backend.onrender.com`

> ⚠️ **Free tier note**: Render's free instances spin down after 15 minutes of inactivity. The first WebSocket connection after sleep may take ~30 seconds. Upgrade to a paid tier ($7/mo) to keep it always on.

---

## Step 2 — Deploy Frontend on Vercel

### 2.1 Create a free Vercel account
Go to → https://vercel.com and sign up (use GitHub login).

### 2.2 Import project
1. Click **Add New → Project**
2. Import your GitHub repo
3. Set the **Root Directory** to `frontend`

### 2.3 Configure build settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.4 Set Environment Variables
In the **Environment Variables** section:

```
VITE_API_BASE_URL   = https://rosy-chats-backend.onrender.com
VITE_WS_BASE_URL    = wss://rosy-chats-backend.onrender.com
```

> **Important**: Use `wss://` (secure WebSocket) since Render uses HTTPS by default.

### 2.5 Deploy
Click **Deploy**. Vercel will build the app.  
Your frontend URL will be: `https://rosy-chats.vercel.app`

### 2.6 Update Backend CORS
Go back to Render → your backend service → **Environment** and update:
```
CORS_ALLOWED_ORIGINS = https://rosy-chats.vercel.app
ALLOWED_HOSTS        = rosy-chats-backend.onrender.com
```
Then click **Manual Deploy → Deploy latest commit** to restart.

---

## Step 3 — Fix WebSocket for Render

Render's free tier uses a reverse proxy that already handles WebSocket upgrade — no extra config needed.

However, you must ensure your Django `ALLOWED_HOSTS` and Channels `AllowedHostsOriginValidator` accept the Render domain. Update `production.py` if needed:

```python
# backend/chatroom/settings/production.py
ALLOWED_HOSTS = ['rosy-chats-backend.onrender.com']
```

---

## Step 4 — Test the Live App

1. Open `https://rosy-chats.vercel.app` in two browser tabs
2. Create a room in Tab 1 → copy the code
3. Join in Tab 2 → send messages
4. Verify real-time updates work in both tabs ✅

---

## Alternative Free Hosts

### Backend alternatives

| Platform | Notes |
|----------|-------|
| **Railway** | https://railway.app — $5 free credit/month, always-on, great DX |
| **Fly.io** | https://fly.io — Free allowance, requires `fly.toml` config |
| **Koyeb** | https://koyeb.com — Always-on free tier, 1 service |

**Railway start command** (same as Render):
```bash
daphne -b 0.0.0.0 -p $PORT chatroom.asgi:application
```

### Frontend alternatives

| Platform | Notes |
|----------|-------|
| **Netlify** | https://netlify.com — Similar to Vercel, free tier |
| **Cloudflare Pages** | https://pages.cloudflare.com — Unlimited requests, global CDN |
| **GitHub Pages** | Static only — works but requires `basename` router config |

---

## Quick Checklist

```
[ ] Code pushed to GitHub
[ ] Render Web Service created (backend/)
[ ] Backend env vars set on Render
[ ] Vercel project created (frontend/)
[ ] Frontend env vars set on Vercel (VITE_API_BASE_URL, VITE_WS_BASE_URL)
[ ] CORS_ALLOWED_ORIGINS on Render updated to Vercel URL
[ ] Both URLs tested in two browser tabs
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| WebSocket won't connect | Make sure you use `wss://` not `ws://` for the WS URL |
| CORS error in browser console | Double-check `CORS_ALLOWED_ORIGINS` on Render matches your Vercel URL exactly |
| "Room not found" after backend wakes up | Room was cleared when Render spun down — create a new one |
| Render build fails | Check `requirements.txt` is in the `backend/` folder |
| Vercel build fails | Confirm Root Directory is set to `frontend` in project settings |
