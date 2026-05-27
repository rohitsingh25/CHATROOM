import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { formatTime, formatDate, isImage } from '../utils/formatters'

// Derive WebSocket base URL:
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

export default function AdminWatchRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])

  const wsRef = useRef(null)
  const bottomRef = useRef(null)
  const token = localStorage.getItem('admin_token')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }

    const url = `${WS_BASE}/ws/chat/${code}/`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      // Join as admin spectator
      ws.send(JSON.stringify({
        type: 'join',
        is_admin: true,
        admin_token: token
      }))
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        const { type } = data

        if (type === 'join_success') {
          setIsConnected(true)
          setOnlineUsers(data.online_users || [])
          setOnlineCount(data.online_count || 0)
          if (data.messages) {
            setMessages(data.messages)
          }
        } else if (type === 'chat') {
          setMessages(prev => [...prev, data])
        } else if (type === 'file') {
          setMessages(prev => [...prev, data])
        } else if (type === 'typing') {
          const username = data.username
          const isTyping = data.is_typing
          setTypingUsers(prev => {
            const without = prev.filter(u => u !== username)
            return isTyping ? [...without, username] : without
          })
        } else if (type === 'user_join') {
          setOnlineCount(data.online_count)
          setOnlineUsers(prev => [...new Set([...prev, data.username])])
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'system',
            content: `${data.username} joined the room`,
            timestamp: new Date().toISOString()
          }])
        } else if (type === 'user_leave') {
          setOnlineCount(data.online_count)
          setOnlineUsers(prev => prev.filter(u => u !== data.username))
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'system',
            content: `${data.username} left the room`,
            timestamp: new Date().toISOString()
          }])
        } else if (type === 'room_closed') {
          toast('The room has been closed/deleted.', { icon: '🔒' })
          navigate('/admin/dashboard')
        } else if (type === 'error') {
          toast.error(data.message)
        }
      } catch (err) {
        console.error('Error parsing WS message:', err)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [code, token, navigate])

  return (
    <div className="full-height flex flex-col bg-[var(--bg-primary)] overflow-hidden relative">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[rgba(108,99,255,0.04)] blur-[130px]" />
        <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-[rgba(239,68,68,0.03)] blur-[110px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[rgba(7,7,13,0.88)] backdrop-blur-xl min-h-[60px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#fa709a] flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--text-primary)] text-sm tracking-widest">{code}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--danger)] bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] rounded-full px-1.5 py-0.5">
                👁 Watch Mode
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={isConnected ? "online-dot" : "w-2 h-2 rounded-full bg-[var(--text-muted)]"} />
              <span className="text-xs text-[var(--text-secondary)] truncate">
                {isConnected ? `${onlineCount} users online (Silent Watch)` : 'Connecting…'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] border border-[rgba(255,255,255,0.1)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)] transition-all duration-200"
          >
            ← Return to Console
          </button>
        </div>
      </header>

      {/* Chat messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 py-3 overscroll-contain relative z-10">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6 py-16">
            <p className="text-[var(--text-secondary)] text-sm font-semibold">No messages in room</p>
            <p className="text-[var(--text-muted)] text-xs mt-1.5">Watching silently. Any chat activity will appear here.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id || i} className="flex justify-center px-4 py-1.5 my-0.5">
                <span className="text-[11px] text-[var(--text-muted)] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-full px-3 py-1 text-center">
                  {msg.content}
                </span>
              </div>
            )
          }

          const isFile = msg.message_type === 'image' || msg.message_type === 'file'
          const isImg = isFile && isImage(msg.file_type)

          return (
            <div key={msg.id || i} className="flex items-end gap-2 px-4 justify-start">
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#9b87f5] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 self-end mb-1">
                {msg.username?.[0]?.toUpperCase()}
              </div>

              <div className="flex flex-col gap-0.5 items-start" style={{ minWidth: 0, maxWidth: 'min(78%, 380px)' }}>
                <span className="text-[11px] text-[var(--text-muted)] font-semibold ml-1 mb-0.5 truncate">
                  {msg.username}
                </span>

                {/* Text Bubble */}
                {!isFile && (
                  <div className="msg-other" style={{ padding: '9px 14px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                )}

                {/* Image Bubble */}
                {isFile && isImg && (
                  <div className="overflow-hidden rounded-2xl rounded-tl-sm border border-[var(--border)] shadow-lg">
                    <img
                      src={msg.file_url}
                      alt={msg.file_name}
                      className="block object-cover"
                      style={{ maxWidth: '260px', maxHeight: '220px', width: 'auto', height: 'auto' }}
                    />
                  </div>
                )}

                {/* File Attachment Bubble */}
                {isFile && !isImg && (
                  <div className="msg-other" style={{ padding: '12px 14px', minWidth: '220px' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[rgba(108,99,255,0.18)] border border-[rgba(108,99,255,0.35)] flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-xs font-semibold leading-snug truncate text-[var(--text-primary)]">
                          {msg.file_name}
                        </span>
                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">
                          {msg.file_type?.split('/')[1] || 'file'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-[var(--text-muted)] px-1 mt-0.5">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          )
        })}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-2 text-xs text-[var(--text-muted)] italic">
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  )
}
