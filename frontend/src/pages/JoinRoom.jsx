import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { toast } from 'react-hot-toast'
import useChatStore from '../store/chatStore'
import { Toaster } from 'react-hot-toast'

export default function JoinRoom() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setRoom } = useChatStore()
  const [code, setCode] = useState(Array(4).fill(''))
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputs = useRef([])

  // Pre-fill code from URL param (e.g. /join?code=1234)
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      const digits = urlCode.replace(/[^0-9]/g, '').slice(0, 4).split('')
      setCode([...digits, ...Array(4 - digits.length).fill('')])
    }
  }, []) // eslint-disable-line

  const handleCodeChange = (i, val) => {
    const ch = val.replace(/[^0-9]/g, '').slice(-1)
    const next = [...code]
    next[i] = ch
    setCode(next)
    if (ch && i < 3) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4)
    const next = Array(4).fill('')
    paste.split('').forEach((c, i) => { next[i] = c })
    setCode(next)
    inputs.current[Math.min(paste.length, 3)]?.focus()
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleJoin = async () => {
    const roomCode = code.join('')
    if (roomCode.length < 4) { toast.error('Enter the full 4-digit code.'); triggerShake(); return }
    if (!username.trim()) { toast.error('Enter your display name.'); return }
    if (username.trim().length < 2) { toast.error('Name must be at least 2 characters.'); return }

    setLoading(true)
    try {
      await api.post('/api/rooms/join/', { room_code: roomCode })
      setRoom(roomCode, username.trim())
      navigate(`/room/${roomCode}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Room not found or expired.'
      toast.error(msg)
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const filled = code.filter(Boolean).length

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center shadow-[0_0_20px_rgba(108,99,255,0.4)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">Join a Room</h2>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">Enter the 4-digit code from your friend</p>
          </div>
        </div>

        {/* Code input section */}
        <div className="flex flex-col gap-3">
          <label className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">
            Room Code
          </label>

          {/* Progress bar */}
          <div className="h-0.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] rounded-full"
              animate={{ width: `${(filled / 4) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex gap-3 justify-center"
          >
            {code.map((c, i) => (
              <motion.input
                id={`code-box-${i}`}
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                className={`code-box ${c ? 'filled' : ''}`}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={c}
                maxLength={1}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
                whileFocus={{ scale: 1.06 }}
                transition={{ duration: 0.15 }}
              />
            ))}
          </motion.div>

          <p className="text-[var(--text-muted)] text-[11px] text-center">
            {filled === 4 ? '✓ Code complete' : `${filled}/4 digits entered`}
          </p>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-2">
          <label className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">
            Your Display Name
          </label>
          <input
            id="input-username-join"
            className="input-glass w-full px-4 py-3.5 rounded-xl text-sm font-medium"
            placeholder="e.g. Bob"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <p className="text-[var(--text-muted)] text-xs">{username.length}/20 characters</p>
        </div>

        {/* Join button */}
        <motion.button
          id="btn-join-now"
          onClick={handleJoin}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 32px rgba(108,99,255,0.5)' } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="btn-glow w-full py-4 rounded-xl text-base font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Joining…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Join Room
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            )}
          </span>
        </motion.button>
      </motion.div>

      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(14,14,24,0.97)', color: '#eeeeff', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', fontSize: '13px' } }} />
    </div>
  )
}
