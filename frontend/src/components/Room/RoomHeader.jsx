import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useChatStore from '../../store/chatStore'
import { toast } from 'react-hot-toast'

export default function RoomHeader({ roomCode, onLeave, onDeleteRoom }) {
  const { onlineCount, onlineUsers, isConnected, isConnecting, isCreator } = useChatStore()
  const [copied, setCopied]           = useState(false)
  const [showUsers, setShowUsers]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)   // delete confirmation modal

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteConfirmed = () => {
    setShowConfirm(false)
    onDeleteRoom()
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
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 flex items-center justify-between px-3 sm:px-5 py-3 border-b border-[var(--border)] bg-[rgba(7,7,13,0.88)] backdrop-blur-xl z-20 min-h-[60px]"
      >
        {/* Left — room icon + info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#9b87f5] flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(108,99,255,0.3)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>

          <div className="min-w-0">
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
              {/* Creator badge */}
              {isCreator && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--accent-2)] bg-[rgba(108,99,255,0.15)] border border-[rgba(108,99,255,0.3)] rounded-full px-1.5 py-0.5">
                  👑 Creator
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={statusDot} />
              <span className="text-xs text-[var(--text-secondary)] truncate">{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Right — avatars + action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">

          {/* Online avatars */}
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

            {/* User dropdown */}
            <AnimatePresence>
              {showUsers && onlineUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 glass border border-[var(--border-bright)] rounded-xl py-2 px-1 z-50 min-w-[150px] shadow-xl"
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

          {/* Creator-only: Delete Room button */}
          {isCreator && (
            <motion.button
              id="btn-delete-room"
              onClick={() => setShowConfirm(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              title="Delete room (you are the creator)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold
                text-[var(--danger)] border border-[rgba(239,68,68,0.25)]
                hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.5)]
                hover:shadow-[0_0_14px_rgba(239,68,68,0.2)]
                transition-all duration-200 whitespace-nowrap hidden sm:flex"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Delete
            </motion.button>
          )}

          {/* Leave Room button */}
          <motion.button
            id="btn-leave-room"
            onClick={onLeave}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
              text-[var(--text-muted)] border border-[rgba(255,255,255,0.1)]
              hover:text-[var(--danger)] hover:border-[rgba(239,68,68,0.4)] hover:bg-[rgba(239,68,68,0.08)]
              transition-all duration-200 whitespace-nowrap"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Leave
          </motion.button>
        </div>
      </motion.header>

      {/* ── Delete Confirmation Modal ─────────────────────── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.88, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 24, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
              className="glass border border-[rgba(239,68,68,0.3)] rounded-2xl p-7 w-full max-w-sm flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete Room?</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    This will <span className="text-[var(--danger)] font-semibold">permanently delete</span> room{' '}
                    <span className="font-mono font-bold text-[var(--accent-2)]">{roomCode}</span>,
                    erase all messages, and disconnect everyone.
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">This action cannot be undone.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <motion.button
                  onClick={handleDeleteConfirmed}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-[rgba(239,68,68,0.9)] hover:bg-[rgba(239,68,68,1)] text-white transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  Yes, Delete Room
                </motion.button>
                <motion.button
                  onClick={() => setShowConfirm(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl text-sm font-semibold glass border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
