import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function RoomExpired({ roomCode }) {
  const navigate = useNavigate()

  return (
    <div className="full-height relative flex items-center justify-center overflow-hidden px-4">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 glass w-full max-w-sm flex flex-col items-center gap-7 text-center"
        style={{ padding: '40px 32px' }}
      >
        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.1, type: 'spring', bounce: 0.4 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[rgba(239,68,68,0.15)] to-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center"
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-3"
        >
          <h2 className="text-2xl font-black text-[var(--text-primary)]">Room Closed</h2>
          {roomCode && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-[var(--text-muted)] text-xs">Room</span>
              <span className="font-mono font-black text-lg gradient-text tracking-widest">{roomCode}</span>
            </div>
          )}
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            This room has been deleted because everyone left
            or it was inactive for 12 hours.
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider px-2">All messages erased</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3 w-full"
        >
          <motion.button
            onClick={() => navigate('/create')}
            whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(108,99,255,0.4)' }}
            whileTap={{ scale: 0.97 }}
            className="btn-glow w-full py-3.5 rounded-xl text-sm font-bold"
          >
            <span style={{ position: 'relative', zIndex: 1 }}>✦ Start a New Room</span>
          </motion.button>

          <motion.button
            onClick={() => navigate('/join')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-xl text-sm font-semibold glass border border-[rgba(255,255,255,0.1)] text-[var(--text-secondary)] hover:border-[rgba(108,99,255,0.4)] hover:text-[var(--text-primary)] transition-all"
          >
            Join Another Room
          </motion.button>

          <button
            onClick={() => navigate('/')}
            className="text-[var(--text-muted)] text-xs hover:text-[var(--text-secondary)] transition-colors mt-1"
          >
            ← Back to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
