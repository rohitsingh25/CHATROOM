import { useEffect, useRef, useCallback } from 'react'
import useChatStore from '../store/chatStore'
import { toast } from 'react-hot-toast'

// Derive WebSocket base URL:
//   1. Use VITE_WS_BASE_URL if explicitly set (e.g. wss://rosychats-backend.onrender.com)
//   2. Derive from VITE_API_BASE_URL by swapping http(s): → ws(s): 
//   3. Fall back to the current browser host (for local dev with Vite proxy)
function getWsBase() {
  if (import.meta.env.VITE_WS_BASE_URL) return import.meta.env.VITE_WS_BASE_URL
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://')
  }
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
}

const WS_BASE = getWsBase()


export function useWebSocket(roomCode, username) {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const reconnectAttempts = useRef(0)
  const MAX_RECONNECT = 5

  const {
    setConnected,
    setConnecting,
    addMessage,
    setOnlineUsers,
    updateOnlineCount,
    setTyping,
  } = useChatStore()

  const connect = useCallback(() => {
    if (!roomCode || !username) return
    setConnecting(true)

    const url = `${WS_BASE}/ws/chat/${roomCode}/`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttempts.current = 0
      ws.send(JSON.stringify({ type: 'join', username }))
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        handleMessage(data)
      } catch (_) {}
    }

    ws.onclose = (e) => {
      setConnected(false)
      if (e.code === 4001 || e.code === 4004 || e.code === 4003) return // fatal
      if (reconnectAttempts.current < MAX_RECONNECT) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 16000)
        reconnectAttempts.current++
        reconnectTimer.current = setTimeout(connect, delay)
      } else {
        toast.error('Lost connection to room.')
      }
    }

    ws.onerror = () => {
      setConnected(false)
    }
  }, [roomCode, username]) // eslint-disable-line

  const handleMessage = useCallback((data) => {
    const { type } = data
    if (type === 'join_success') {
      setConnected(true)
      setOnlineUsers(data.online_users, data.online_count)
    } else if (type === 'chat') {
      addMessage({ ...data, own: false })
    } else if (type === 'file') {
      addMessage({ ...data, own: false })
    } else if (type === 'typing') {
      setTyping(data.username, data.is_typing)
    } else if (type === 'user_join') {
      updateOnlineCount(data.online_count, data.username, 'join')
      addMessage({ id: crypto.randomUUID(), type: 'system', content: `${data.username} joined the room`, timestamp: new Date().toISOString() })
    } else if (type === 'user_leave') {
      updateOnlineCount(data.online_count, data.username, 'leave')
      addMessage({ id: crypto.randomUUID(), type: 'system', content: `${data.username} left the room`, timestamp: new Date().toISOString() })
    } else if (type === 'room_closed') {
      toast('Room has been closed.', { icon: '🚪' })
    } else if (type === 'error') {
      toast.error(data.message)
    }
  }, [setConnected, setOnlineUsers, addMessage, setTyping, updateOnlineCount])

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  const sendChat = useCallback((content) => {
    send({ type: 'chat', content })
    // Optimistically add own message
    addMessage({
      id: crypto.randomUUID(),
      type: 'chat',
      username,
      content,
      timestamp: new Date().toISOString(),
      own: true,
    })
  }, [send, username, addMessage])

  const sendTyping = useCallback((isTyping) => {
    send({ type: 'typing', is_typing: isTyping })
  }, [send])

  const sendFile = useCallback((fileData) => {
    send({ type: 'file', ...fileData })
    addMessage({
      id: crypto.randomUUID(),
      type: 'file',
      ...fileData,
      username,
      timestamp: new Date().toISOString(),
      own: true,
    })
  }, [send, username, addMessage])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { send, sendChat, sendTyping, sendFile }
}
