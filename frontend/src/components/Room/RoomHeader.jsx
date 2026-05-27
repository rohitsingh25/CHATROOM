import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useChatStore from '../../store/chatStore'
import { toast } from 'react-hot-toast'

export default function RoomHeader({ roomCode, onLeave }) {
  const { onlineCount, onlineUsers, isConnected, isConnecting } = useChatStore()
  const [copied, setCopied] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const statusDot = isConnected
    ? 'online-dot'
    : 'w-2 h-2 rounded-full bg-[var(--text-muted)] flex-shrink-0'

  const statusLabel = isConnected
    ? `${onlineCount} online`
    : isConnecting
    ? 'Connecting…'
    : 'Reconnecting…'

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex-shrink-0 flex items-center justify-between px-3 sm:px-5 py-3 border-b border-[var(--border)] bg-[rgba(7,7,13,0.85)] backdrop-blur-xl z-20 min-h-[60px]"
    >
      {/* Left — room icon + info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#9b87f5] flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(108,99,255,0.3)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>

        <div className="min-w-0">
          {/* Room code + copy */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[var(--text-primary)] text-sm tracking-widest">{roomCode}</span>
            <button
              id="btn-header-copy"
              onClick={copyCode}
              title="Copy room code"
              className="text-[var(--text-muted)] hover:text-[var(--accent-2)] transition-colors p-0.5 rounded"
            >
              {copied
                ? <span className="text-[10px] text-[var(--success)] font-semibold">✓</span>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={statusDot} />
            <span className="text-xs text-[var(--text-secondary)] truncate">{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Right — avatars + leave */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {/* Online avatars — click to toggle list on mobile */}
        <div className="relative">
          <button
            onClick={() => setShowUsers(v => !v)}
            className="flex items-center"
            title="Online users"
          >
            {onlineUsers.slice(0, 3).map((u, i) => (
              <div
                key={u}
                title={u}
                style={{ zIndex: 10 - i, marginLeft: i > 0 ? '-7px' : 0 }}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#9b87f5] flex items-center justify-center text-white text-[10px] font-bold border-2 border-[var(--bg-primary)] flex-shrink-0"
              >
                {u[0]?.toUpperCase()}
              </div>
            ))}
            {onlineUsers.length > 3 && (
              <div
                className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.1)] border-2 border-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)] text-[10px] font-semibold flex-shrink-0"
                style={{ marginLeft: '-7px', zIndex: 6 }}
              >
                +{onlineUsers.length - 3}
              </div>
            )}
          </button>

          {/* Dropdown user list */}
          <AnimatePresence>
            {showUsers && onlineUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 glass border border-[var(--border-bright)] rounded-xl py-2 px-1 z-50 min-w-[140px] shadow-xl"
              >
                {onlineUsers.map(u => (
                  <div key={u} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[rgba(108,99,255,0.08)] transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#9b87f5] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {u[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs text-[var(--text-primary)] truncate max-w-[90px]">{u}</span>
                    <div className="online-dot ml-auto" />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          id="btn-leave-room"
          onClick={onLeave}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--danger)] border border-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.45)] transition-all whitespace-nowrap"
        >
          Leave
        </button>
      </div>
    </motion.header>
  )
}
