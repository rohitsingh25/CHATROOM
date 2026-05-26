import { useState } from 'react'
import { motion } from 'framer-motion'
import useChatStore from '../../store/chatStore'
import { toast } from 'react-hot-toast'

export default function RoomHeader({ roomCode, onLeave }) {
  const { onlineCount, onlineUsers, isConnected } = useChatStore()
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[rgba(10,10,15,0.8)] backdrop-blur-xl"
    >
      {/* Left — room info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)] text-sm">{roomCode}</span>
            <button
              id="btn-header-copy"
              onClick={copyCode}
              title="Copy room code"
              className="text-[var(--text-muted)] hover:text-[var(--accent-2)] transition-colors"
            >
              {copied
                ? <span className="text-xs text-[var(--success)]">✓</span>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={isConnected ? 'online-dot' : 'w-2 h-2 rounded-full bg-[var(--text-muted)]'} />
            <span className="text-xs text-[var(--text-secondary)]">
              {isConnected ? `${onlineCount} online` : 'Connecting…'}
            </span>
          </div>
        </div>
      </div>

      {/* Right — users + leave */}
      <div className="flex items-center gap-2">
        {/* Online avatars */}
        <div className="hidden sm:flex items-center">
          {onlineUsers.slice(0, 4).map((u, i) => (
            <div
              key={u}
              title={u}
              style={{ zIndex: 10 - i, marginLeft: i > 0 ? '-8px' : 0 }}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center text-white text-xs font-bold border-2 border-[var(--bg-primary)]"
            >
              {u[0]?.toUpperCase()}
            </div>
          ))}
          {onlineUsers.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.1)] border-2 border-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)] text-xs" style={{ marginLeft: '-8px' }}>
              +{onlineUsers.length - 4}
            </div>
          )}
        </div>

        <button
          id="btn-leave-room"
          onClick={onLeave}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--danger)] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.1)] transition-all"
        >
          Leave
        </button>
      </div>
    </motion.header>
  )
}
