import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import useChatStore from '../store/chatStore'

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
      const { data } = await axios.post('/api/rooms/create/')
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
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Create a Room</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Set your name and get a 4-digit room code</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[var(--text-secondary)] text-sm font-medium">Your Display Name</label>
          <input
            id="input-username-create"
            className="input-glass w-full px-4 py-3 rounded-xl text-base"
            placeholder="e.g. Alice"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !roomCode && handleCreate()}
          />
        </div>

        {!roomCode ? (
          <button
            id="btn-create-now"
            onClick={handleCreate}
            disabled={loading}
            className="btn-glow w-full py-3.5 rounded-xl text-base font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating…' : '✦ Create Room'}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="rounded-xl bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.3)] p-5 flex flex-col items-center gap-3">
              <p className="text-[var(--text-secondary)] text-sm">Share this code</p>
              <p className="text-4xl font-black tracking-[0.3em] gradient-text">{roomCode}</p>
              <button
                id="btn-copy-code"
                onClick={copyCode}
                className="text-xs px-4 py-1.5 rounded-lg bg-[rgba(108,99,255,0.2)] border border-[rgba(108,99,255,0.4)] text-[var(--accent-2)] hover:bg-[rgba(108,99,255,0.3)] transition-colors"
              >
                {copied ? '✓ Copied!' : '⎘ Copy Code'}
              </button>
            </div>
            <button
              id="btn-enter-room"
              onClick={enterRoom}
              className="btn-glow w-full py-3.5 rounded-xl text-base font-semibold"
            >
              Enter Room →
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
