import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { toast } from 'react-hot-toast'
import useChatStore from '../store/chatStore'
import { Toaster } from 'react-hot-toast'

export default function CreateRoom() {
  const navigate = useNavigate()
  const { setRoom } = useChatStore()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [roomCode, setRoomCode] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!username.trim()) { toast.error('Enter your display name first.'); return }
    if (username.trim().length < 2) { toast.error('Name must be at least 2 characters.'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/api/rooms/create/')
      setRoomCode(data.room_code)
    } catch {
      toast.error('Could not create room. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const enterRoom = () => {
    setRoom(roomCode, username.trim())
    navigate(`/room/${roomCode}`)
  }

  return (
    <div className="full-height relative flex items-center justify-center overflow-hidden px-4">
      <div className="orb orb-1" /><div className="orb orb-2" />

      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass w-full max-w-md flex flex-col gap-7 relative z-10"
        style={{ padding: '36px 32px' }}
      >
        {/* Back */}
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ x: -3 }}
          className="text-[var(--text-muted)] text-sm flex items-center gap-1.5 hover:text-[var(--accent-2)] transition-colors self-start"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </motion.button>

        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center shadow-[0_0_20px_rgba(108,99,255,0.4)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">Create a Room</h2>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">Get a 4-digit code to share with friends</p>
            </div>
          </div>
        </div>

        {/* Username input */}
        <div className="flex flex-col gap-2">
          <label className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">
            Your Display Name
          </label>
          <input
            id="input-username-create"
            className="input-glass w-full px-4 py-3.5 rounded-xl text-sm font-medium"
            placeholder="e.g. Alice"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !roomCode && handleCreate()}
            autoFocus
          />
          <p className="text-[var(--text-muted)] text-xs">{username.length}/20 characters</p>
        </div>

        {/* Create / Room code section */}
        <AnimatePresence mode="wait">
          {!roomCode ? (
            <motion.button
              key="create-btn"
              id="btn-create-now"
              onClick={handleCreate}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 32px rgba(108,99,255,0.5)' } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="btn-glow w-full py-4 rounded-xl text-base font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span style={{ position: 'relative', zIndex: 1 }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating…
                  </span>
                ) : '✦ Create Room'}
              </span>
            </motion.button>
          ) : (
            <motion.div
              key="room-code"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col gap-4"
            >
              {/* Code display card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[rgba(108,99,255,0.12)] to-[rgba(167,139,250,0.08)] border border-[rgba(108,99,255,0.3)] p-6">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(108,99,255,0.05)] to-transparent pointer-events-none" />

                <div className="relative flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-widest">Room Code</p>
                    <p className="text-5xl font-black tracking-[0.35em] gradient-text font-mono select-all">{roomCode}</p>
                  </div>

                  <motion.button
                    id="btn-copy-code"
                    onClick={copyCode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={copied ? { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.5)' } : {}}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[rgba(108,99,255,0.15)] border border-[rgba(108,99,255,0.4)] text-[var(--accent-2)] text-sm font-semibold hover:bg-[rgba(108,99,255,0.25)] transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ color: '#10b981' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy Code
                      </>
                    )}
                  </motion.button>

                  <p className="text-[var(--text-muted)] text-[11px] text-center leading-relaxed">
                    Share this code with people you want to chat with.<br/>The room expires after 30 min of inactivity.
                  </p>
                </div>
              </div>

              <motion.button
                id="btn-enter-room"
                onClick={enterRoom}
                whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(108,99,255,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="btn-glow w-full py-4 rounded-xl text-base font-bold tracking-wide flex items-center justify-center gap-2"
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Enter Room
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(14,14,24,0.97)', color: '#eeeeff', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', fontSize: '13px' } }} />
    </div>
  )
}
