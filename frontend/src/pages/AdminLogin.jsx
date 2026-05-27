import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { toast } from 'react-hot-toast'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both Admin ID and Password.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/api/admin/login/', {
        username: username.trim(),
        password: password.trim()
      })
      localStorage.setItem('admin_token', data.token)
      toast.success('Admin login successful!')
      navigate('/admin/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
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
        className="glass w-full max-w-sm flex flex-col gap-7 relative z-10"
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
          Back to Home
        </motion.button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center shadow-[0_0_20px_rgba(108,99,255,0.4)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">Admin Portal</h2>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">Please sign in to manage rooms</p>
          </div>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-2">
          <label className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">
            Admin ID
          </label>
          <input
            id="input-admin-id"
            className="input-glass w-full px-4 py-3.5 rounded-xl text-sm font-medium"
            placeholder="e.g. rohit"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">
            Password
          </label>
          <input
            id="input-admin-password"
            type="password"
            className="input-glass w-full px-4 py-3.5 rounded-xl text-sm font-medium"
            placeholder="••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {/* Login button */}
        <motion.button
          id="btn-admin-submit"
          onClick={handleLogin}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 32px rgba(108,99,255,0.5)' } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="btn-glow w-full py-4 rounded-xl text-base font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            )}
          </span>
        </motion.button>
      </motion.div>
    </div>
  )
}
