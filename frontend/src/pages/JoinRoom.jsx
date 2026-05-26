import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import useChatStore from '../store/chatStore'

export default function JoinRoom() {
  const navigate = useNavigate()
  const { setRoom } = useChatStore()
  const [code, setCode] = useState(Array(4).fill(''))
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputs = useRef([])

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
      await axios.post('/api/rooms/join/', { room_code: roomCode })
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

  return (
    <div className="full-height relative flex items-center justify-center px-4">
      <div className="orb orb-1" /><div className="orb orb-2" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass w-full max-w-md p-8 flex flex-col gap-6 relative z-10"
      >
        <button onClick={() => navigate('/')} className="text-[var(--text-muted)] text-sm flex items-center gap-1 hover:text-[var(--text-secondary)] transition-colors self-start">
          ← Back
        </button>

        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Join a Room</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Enter the 4-digit room code</p>
        </div>

        {/* Code boxes */}
        <AnimatePresence>
          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex gap-2 justify-center"
          >
            {code.map((c, i) => (
              <input
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
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Username */}
        <div className="flex flex-col gap-2">
          <label className="text-[var(--text-secondary)] text-sm font-medium">Your Display Name</label>
          <input
            id="input-username-join"
            className="input-glass w-full px-4 py-3 rounded-xl text-base"
            placeholder="e.g. Bob"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <button
          id="btn-join-now"
          onClick={handleJoin}
          disabled={loading}
          className="btn-glow w-full py-3.5 rounded-xl text-base font-semibold disabled:opacity-50"
        >
          {loading ? 'Joining…' : 'Join Room →'}
        </button>
      </motion.div>
    </div>
  )
}
