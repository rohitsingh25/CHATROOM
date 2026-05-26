import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const orbs = (
  <>
    <div className="orb orb-1" />
    <div className="orb orb-2" />
    <div className="orb orb-3" />
  </>
)

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="full-height relative flex items-center justify-center overflow-hidden">
      {orbs}
      <div className="relative z-10 flex flex-col items-center gap-12 px-4 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center shadow-[0_0_40px_rgba(108,99,255,0.4)]">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold gradient-text tracking-tight">ROSY - Chats</h1>
          <p className="text-[var(--text-secondary)] text-base max-w-xs leading-relaxed">
            Real-time temporary chat rooms. No logs. No history. Just conversation.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full flex flex-col gap-4"
        >
          <button
            id="btn-create-room"
            onClick={() => navigate('/create')}
            className="btn-glow w-full py-4 rounded-2xl text-lg font-semibold relative z-10"
          >
            ✦ Create a Room
          </button>

          <button
            id="btn-join-room"
            onClick={() => navigate('/join')}
            className="w-full py-4 rounded-2xl text-lg font-semibold glass border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] hover:border-[rgba(108,99,255,0.5)] hover:bg-[rgba(108,99,255,0.08)] transition-all duration-300"
          >
            Enter Room Code
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[var(--text-muted)] text-xs text-center"
        >
          Rooms auto-delete after 30 min of inactivity · No data stored
        </motion.p>
      </div>
    </div>
  )
}
