import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'

export default function NotFound({ message, showJoin = true }) {
  const navigate = useNavigate()
  const location = useLocation()

  const displayMessage = message || "The page you're looking for doesn't exist or has expired."

  return (
    <div className="full-height relative flex items-center justify-center overflow-hidden px-4">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-8 text-center max-w-sm w-full"
      >
        {/* Icon with animated ring */}
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[rgba(108,99,255,0.15)] to-[rgba(167,139,250,0.08)] border border-[rgba(108,99,255,0.25)] flex items-center justify-center"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(108,99,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </motion.div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--danger)] flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.5)]">
            <span className="text-white text-[9px] font-black">!</span>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-black gradient-text">
            {message ? 'Something went wrong' : 'Page Not Found'}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed px-4">
            {displayMessage}
          </p>
          {location.pathname !== '/' && (
            <p className="text-[var(--text-muted)] text-xs font-mono bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-lg px-3 py-1.5">
              {location.pathname}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full">
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(108,99,255,0.4)' }}
            whileTap={{ scale: 0.97 }}
            className="btn-glow w-full py-3.5 rounded-xl text-sm font-bold"
          >
            <span style={{ position: 'relative', zIndex: 1 }}>↩ Go to Home</span>
          </motion.button>

          {showJoin && (
            <motion.button
              onClick={() => navigate('/join')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold glass border border-[rgba(255,255,255,0.1)] text-[var(--text-secondary)] hover:border-[rgba(108,99,255,0.4)] hover:text-[var(--text-primary)] transition-all"
            >
              Join a Room Instead
            </motion.button>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-[var(--text-muted)] text-[11px]">
          Chat rooms delete automatically when everyone leaves
        </p>
      </motion.div>
    </div>
  )
}
