import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useChatStore from '../store/chatStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { loadSession } from '../utils/session'
import api from '../utils/api'
import RoomHeader from '../components/Room/RoomHeader'
import ChatWindow from '../components/Chat/ChatWindow'
import MessageInput from '../components/Chat/MessageInput'
import RoomExpired from './RoomExpired'
import NotFound from './NotFound'
import { Toaster, toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatRoom() {
  const { code } = useParams()
  const navigate  = useNavigate()
  const { username, isConnected, isConnecting, setRoom, clearRoom } = useChatStore()

  // 'checking' | 'ready' | 'expired' | 'error'
  const [pageState, setPageState] = useState('checking')

  // ── Session init ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      // 1. Username already in store (normal navigation) — just verify room exists
      if (username) {
        try {
          await api.post('/api/rooms/join/', { room_code: code })
          if (!cancelled) setPageState('ready')
        } catch (err) {
          if (!cancelled)
            setPageState(err.response?.status === 404 ? 'expired' : 'error')
        }
        return
      }

      // 2. Try restoring session from sessionStorage (page reload)
      const saved = loadSession()
      if (saved && saved.roomCode === code) {
        try {
          await api.post('/api/rooms/join/', { room_code: code })
          if (!cancelled) {
            setRoom(code, saved.username, saved.isCreator)
            setPageState('ready')
          }
        } catch (err) {
          if (!cancelled) {
            clearRoom()
            setPageState(err.response?.status === 404 ? 'expired' : 'error')
          }
        }
        return
      }

      // 3. No session — send user to join page with code pre-filled
      if (!cancelled) navigate(`/join?code=${code}`, { replace: true })
    }

    init()
    return () => { cancelled = true }
  }, [code]) // eslint-disable-line

  // ── Room-closed callback ───────────────────────────────────
  const handleRoomClosed = useCallback(({ reason, creator }) => {
    clearRoom()
    if (reason === 'deleted_by_creator') {
      toast(`Room deleted by ${creator}.`, { icon: '🚪', duration: 4000 })
    } else {
      toast('This room has expired.', { icon: '⏰', duration: 4000 })
    }
    navigate('/')
  }, [clearRoom, navigate])

  // ── WebSocket (only active when page is ready) ─────────────
  const { sendChat, sendTyping, sendFile, sendDeleteRoom } = useWebSocket(
    pageState === 'ready' ? code : null,
    username,
    { onRoomClosed: handleRoomClosed }
  )

  const handleLeave = () => {
    clearRoom()
    navigate('/')
  }

  // ── Dead-end screens ───────────────────────────────────────
  if (pageState === 'expired') return <RoomExpired roomCode={code} />
  if (pageState === 'error')   return (
    <NotFound
      message="Something went wrong connecting to this room. Please try again."
      showJoin
    />
  )

  // ── Loading screen ─────────────────────────────────────────
  if (pageState === 'checking') {
    return (
      <div className="full-height relative flex items-center justify-center overflow-hidden">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#9b87f5] flex items-center justify-center shadow-[0_0_40px_rgba(108,99,255,0.4)]">
            <div className="w-6 h-6 border-[2.5px] border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[var(--text-primary)] font-semibold text-sm">Connecting to room</p>
            <p className="text-[var(--text-muted)] text-xs mt-1 font-mono tracking-widest">{code}</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Main chat view ─────────────────────────────────────────
  return (
    <div className="full-height flex flex-col bg-[var(--bg-primary)] overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[rgba(108,99,255,0.055)] blur-[130px]" />
        <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-[rgba(167,139,250,0.045)] blur-[110px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-0">
        <RoomHeader
          roomCode={code}
          onLeave={handleLeave}
          onDeleteRoom={sendDeleteRoom}
        />

        {/* Connecting / reconnecting banner */}
        <AnimatePresence>
          {!isConnected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="connecting-banner">
                <div className="w-3 h-3 border-[1.5px] border-[var(--accent-2)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>{isConnecting ? 'Connecting to room…' : 'Lost connection — reconnecting…'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col flex-1 min-h-0">
          <ChatWindow />
          <MessageInput
            onSendChat={sendChat}
            onSendTyping={sendTyping}
            onSendFile={sendFile}
            roomCode={code}
          />
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(14,14,24,0.97)',
            color: '#eeeeff',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '12px',
            fontSize: '13px',
            padding: '10px 14px',
            maxWidth: '320px',
          },
        }}
      />
    </div>
  )
}
