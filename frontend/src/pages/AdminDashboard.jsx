import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { toast } from 'react-hot-toast'
import { formatTime } from '../utils/formatters'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null) // room to confirm deletion for

  const token = localStorage.getItem('admin_token')

  const fetchRooms = async () => {
    if (!token) {
      navigate('/admin/login')
      return
    }

    try {
      const { data } = await api.get('/api/admin/rooms/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRooms(data.rooms || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token')
        toast.error('Session expired. Please log in again.')
        navigate('/admin/login')
      } else {
        toast.error('Failed to fetch rooms.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 15_000) // poll every 15s
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    toast.success('Logged out successfully.')
    navigate('/')
  }

  const handleCloseRoom = async (roomCode) => {
    try {
      await api.post('/api/admin/rooms/', { room_code: roomCode }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(`Room ${roomCode} successfully closed.`)
      setRooms(rooms.filter(r => r.code !== roomCode))
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Failed to close room.')
    }
  }

  const filteredRooms = rooms.filter(r =>
    r.code.includes(searchTerm) ||
    r.users.some(u => u.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="full-height flex flex-col bg-[var(--bg-primary)] overflow-hidden relative">
      <div className="orb orb-1" /><div className="orb orb-2" />

      {/* Header bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[rgba(7,7,13,0.88)] backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-[var(--text-primary)] text-base leading-none">Admin Console</h1>
            <span className="text-[10px] text-[var(--accent-2)] font-semibold tracking-wider uppercase">Active Control Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRooms}
            className="p-2 rounded-xl border border-[var(--border)] glass hover:border-[var(--border-bright)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Refresh Rooms"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] border border-[rgba(255,255,255,0.1)] hover:text-[var(--danger)] hover:border-[rgba(239,68,68,0.4)] hover:bg-[rgba(239,68,68,0.08)] transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 z-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {/* Stats & Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Active Chat Rooms</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {rooms.length} room{rooms.length === 1 ? '' : 's'} online right now
              </p>
            </div>
            <input
              id="admin-search-input"
              className="input-glass px-4 py-2.5 rounded-xl text-xs font-medium w-full sm:max-w-xs"
              placeholder="Search by code or user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[var(--text-muted)]">Loading room details...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="glass p-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                ☁️
              </div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">No rooms found</p>
              <p className="text-xs text-[var(--text-muted)]">There are no active chat rooms matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms.map(room => (
                <div key={room.code} className="glass p-5 flex flex-col gap-4 border border-[var(--border)] hover:border-[var(--border-bright)] transition-all">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-lg bg-[rgba(108,99,255,0.12)] border border-[rgba(108,99,255,0.3)] flex items-center justify-center text-[var(--accent-2)] font-mono font-bold text-sm tracking-wider">
                        {room.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)] font-semibold">Active Room</span>
                          <div className="online-dot w-1.5 h-1.5" />
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Last activity: {formatTime(room.last_active)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/watch/${room.code}`)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[var(--accent-2)] bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.2)] hover:bg-[rgba(108,99,255,0.2)] hover:border-[rgba(108,99,255,0.4)] transition-all"
                        title="Watch chat silently"
                      >
                        👁 Watch
                      </button>
                      <button
                        onClick={() => setDeleteTarget(room)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[var(--danger)] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)] hover:border-[rgba(239,68,68,0.4)] transition-all"
                      >
                        Close Room
                      </button>
                    </div>
                  </div>

                  {/* Card details */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-[rgba(255,255,255,0.02)] rounded-xl p-3 border border-[rgba(255,255,255,0.03)]">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Online Users</span>
                      <p className="font-semibold text-[var(--text-primary)] mt-0.5">{room.users.length} user{room.users.length === 1 ? '' : 's'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Messages</span>
                      <p className="font-semibold text-[var(--text-primary)] mt-0.5">{room.messages_count} sent</p>
                    </div>
                  </div>

                  {/* Connected users list */}
                  {room.users.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Connected:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {room.users.map(u => (
                          <span key={u} className="text-[10px] font-semibold text-[var(--text-primary)] bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.18)] rounded-full px-2.5 py-1">
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.88, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 24, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
              className="glass border border-[rgba(239,68,68,0.3)] rounded-2xl p-7 w-full max-w-sm flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Force Close Room?</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    This will close room{' '}
                    <span className="font-mono font-bold text-[var(--accent-2)]">{deleteTarget.code}</span>,
                    erase all data, and boot all connected users back to the homepage.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleCloseRoom(deleteTarget.code)}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-[rgba(239,68,68,0.9)] hover:bg-[rgba(239,68,68,1)] text-white transition-colors shadow-lg"
                >
                  Yes, Close Room
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-3 rounded-xl text-sm font-semibold glass border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
