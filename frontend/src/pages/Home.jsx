import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Home() {
  const navigate = useNavigate()
  const [activeRooms, setActiveRooms] = useState(null)   // null = loading

  // Fetch active room count on mount and every 30 seconds
  useEffect(() => {
    let cancelled = false

    const fetchCount = async () => {
      try {
        const { data } = await api.get('/api/rooms/active/')
        if (!cancelled) setActiveRooms(data.active_rooms)
      } catch {
        // Backend offline during cold start — just don't show the badge
        if (!cancelled) setActiveRooms(null)
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <div className="full-height relative flex items-center justify-center overflow-hidden px-4">
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Active rooms badge — top-right ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute top-4 right-4 z-20"
      >
        {activeRooms !== null && (
          <div className="flex items-center gap-2 glass border border-[var(--border)] rounded-full px-3.5 py-1.5 shadow-md">
            {/* Pulsing green dot */}
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] whitespace-nowrap">
              {activeRooms === 0
                ? 'No active rooms'
                : `${activeRooms} active room${activeRooms === 1 ? '' : 's'}`
              }
            </span>
          </div>
        )}
      </motion.div>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm">

        {/* Hero block */}
        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="flex flex-col items-center gap-5 text-center"
        >
          {/* Logo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center shadow-[0_0_50px_rgba(108,99,255,0.5),0_0_100px_rgba(108,99,255,0.2)]">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="absolute inset-0 rounded-3xl border-2 border-[rgba(108,99,255,0.4)] animate-ping" style={{ animationDuration: '3s' }} />
          </div>

          <div>
            <h1 className="text-5xl font-black gradient-text tracking-tight leading-none pb-1">ROSY</h1>
            <p className="text-[var(--text-muted)] text-sm font-semibold tracking-[0.25em] uppercase mt-1">Chats</p>
          </div>

          <p className="text-[var(--text-secondary)] text-sm max-w-[260px] leading-relaxed">
            Instant, private chat rooms.{' '}
            <span className="text-[var(--accent-2)]">No accounts.</span> No history. Just talk.
          </p>

          {/* Feature pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {['🔒 Encrypted', '⚡ Real-time', '🗑️ Auto-delete'].map(f => (
              <span
                key={f}
                className="text-[10px] font-semibold text-[var(--text-muted)] bg-[rgba(255,255,255,0.05)] border border-[var(--border)] rounded-full px-3 py-1"
              >
                {f}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.18 }}
          className="w-full flex flex-col gap-3"
        >
          <motion.button
            id="btn-create-room"
            onClick={() => navigate('/create')}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(108,99,255,0.5), 0 8px 32px rgba(0,0,0,0.4)' }}
            whileTap={{ scale: 0.97 }}
            className="btn-glow w-full py-4 rounded-2xl text-base font-bold tracking-wide relative z-10"
          >
            <span style={{ position: 'relative', zIndex: 1 }}>✦ Create a Room</span>
          </motion.button>

          <motion.button
            id="btn-join-room"
            onClick={() => navigate('/join')}
            whileHover={{ scale: 1.02, borderColor: 'rgba(108,99,255,0.6)', backgroundColor: 'rgba(108,99,255,0.1)' }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-base font-bold glass border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] transition-all duration-200"
          >
            Enter Room Code
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-1.5"
        >
          <p className="text-[var(--text-muted)] text-[11px] text-center">
            Rooms auto-delete after 12 hours of inactivity
          </p>
          <p className="text-[var(--text-muted)] text-[11px]">
            No data stored · No accounts required
          </p>
        </motion.div>
      </div>
    </div>
  )
}
