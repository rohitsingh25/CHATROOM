import { motion, AnimatePresence } from 'framer-motion'
import useChatStore from '../../store/chatStore'
import { formatTime, formatDate, isImage } from '../../utils/formatters'
import { useEffect, useRef, useState } from 'react'
import TypingIndicator from './TypingIndicator'

/* ─── Date separator ─────────────────────────────────── */
function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 my-1">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] flex-shrink-0 px-1">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

/* ─── System message ─────────────────────────────────── */
function SystemMessage({ content }) {
  return (
    <div className="flex justify-center px-4 py-1.5 my-0.5">
      <span
        className="text-[11px] text-[var(--text-muted)] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-full px-3 py-1"
        style={{ maxWidth: '80%', textAlign: 'center', wordBreak: 'break-word' }}
      >
        {content}
      </span>
    </div>
  )
}

/* ─── Download button — fetch→blob so it saves to downloads ─ */
function DownloadButton({ fileUrl, fileName, own }) {
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  const handleDownload = async (e) => {
    e.stopPropagation()
    if (status === 'loading') return
    setStatus('loading')
    try {
      // Fetch the file as a blob — backend sends CORS headers so this works cross-origin
      const resp = await fetch(fileUrl, { mode: 'cors' })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Revoke after a short delay so Safari has time to start the download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const base = own
    ? 'bg-[rgba(255,255,255,0.18)] border-[rgba(255,255,255,0.25)] text-white hover:bg-[rgba(255,255,255,0.3)]'
    : 'bg-[rgba(108,99,255,0.12)] border-[rgba(108,99,255,0.25)] text-[var(--accent-2)] hover:bg-[rgba(108,99,255,0.25)]'

  const icons = {
    idle: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    loading: <div className="w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />,
    done: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    error: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  }

  const labels = { idle: 'Download', loading: 'Saving…', done: 'Saved!', error: 'Retry' }

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'loading'}
      title={`Download ${fileName}`}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 disabled:opacity-70 ${base}`}
    >
      {icons[status]}
      {labels[status]}
    </button>
  )
}

/* ─── Avatar ─────────────────────────────────────────── */
const AVATAR_COLORS = [
  'from-[#6c63ff] to-[#9b87f5]',
  'from-[#f093fb] to-[#f5576c]',
  'from-[#4facfe] to-[#00f2fe]',
  'from-[#43e97b] to-[#38f9d7]',
  'from-[#fa709a] to-[#fee140]',
  'from-[#a18cd1] to-[#fbc2eb]',
]

function Avatar({ name }) {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0
  return (
    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx]} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 self-end mb-1 shadow-sm`}>
      {name?.[0]?.toUpperCase()}
    </div>
  )
}

/* ─── Message bubble ─────────────────────────────────── */
function MessageBubble({ msg, own, showAvatar }) {
  const [imgError, setImgError] = useState(false)
  const isFileMsg = msg.message_type === 'image' || msg.message_type === 'file' || msg.type === 'file'
  const isImgMsg  = isFileMsg && isImage(msg.file_type) && !imgError

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 px-3 sm:px-4 ${own ? 'justify-end' : 'justify-start'}`}
    >
      {!own && (showAvatar ? <Avatar name={msg.username} /> : <div className="w-7 flex-shrink-0" />)}

      <div
        className={`flex flex-col gap-0.5 ${own ? 'items-end' : 'items-start'}`}
        style={{ minWidth: 0, maxWidth: 'min(78%, 380px)' }}
      >
        {!own && showAvatar && (
          <span className="text-[11px] text-[var(--text-muted)] font-semibold ml-1 mb-0.5 truncate" style={{ maxWidth: '100%' }}>
            {msg.username}
          </span>
        )}

        {/* Text */}
        {(msg.message_type === 'text' || msg.type === 'chat') && (
          <div
            className={own ? 'msg-own' : 'msg-other'}
            style={{ padding: '9px 14px', wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0, width: '100%' }}
          >
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        )}

        {/* Image */}
        {isFileMsg && isImgMsg && (
          <div className={`rounded-2xl overflow-hidden ${own ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} style={{ maxWidth: '100%' }}>
            <div className="relative group">
              <img
                src={msg.file_url}
                alt={msg.file_name || 'image'}
                className="block w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxWidth: '260px', maxHeight: '220px', width: 'auto', height: 'auto' }}
                onClick={() => window.open(msg.file_url, '_blank')}
                onError={() => setImgError(true)}
              />
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <DownloadButton fileUrl={msg.file_url} fileName={msg.file_name} own={own} />
              </div>
            </div>
          </div>
        )}

        {/* File / broken image */}
        {isFileMsg && !isImgMsg && (
          <div
            className={own ? 'msg-own' : 'msg-other'}
            style={{ padding: '10px 14px', minWidth: 0, width: '100%' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(108,99,255,0.2)] border border-[rgba(108,99,255,0.35)] flex items-center justify-center flex-shrink-0 mt-0.5">
                {imgError
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                }
              </div>
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <span className="text-sm font-medium leading-snug opacity-90" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                  {imgError ? 'Image unavailable' : (msg.file_name || 'File')}
                </span>
                {!imgError
                  ? <DownloadButton fileUrl={msg.file_url} fileName={msg.file_name} own={own} />
                  : <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent-2)] underline underline-offset-2 hover:opacity-80">Open link ↗</a>
                }
              </div>
            </div>
          </div>
        )}

        <span className="text-[10px] text-[var(--text-muted)] px-1 mt-0.5">{formatTime(msg.timestamp)}</span>
      </div>

      {own && <div className="w-1 flex-shrink-0" />}
    </motion.div>
  )
}

/* ─── Main ChatWindow ────────────────────────────────── */
export default function ChatWindow() {
  const { messages, typingUsers, username } = useChatStore()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const rendered = []
  let lastDate = null
  let lastSender = null

  messages.forEach((msg) => {
    const dateLabel = formatDate(msg.timestamp)
    if (dateLabel && dateLabel !== lastDate) {
      lastDate = dateLabel
      lastSender = null
      rendered.push(<DateSeparator key={`date-${msg.id}`} label={dateLabel} />)
    }
    if (msg.type === 'system') {
      lastSender = null
      rendered.push(<SystemMessage key={msg.id} content={msg.content} />)
    } else {
      const own = msg.own || msg.username === username
      const showAvatar = !own && msg.username !== lastSender
      lastSender = msg.username
      rendered.push(<MessageBubble key={msg.id} msg={msg} own={own} showAvatar={showAvatar} />)
    }
  })

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 py-4 overscroll-contain">
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.18)] flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(108,99,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-sm font-medium">No messages yet</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">Say hello to start the conversation 👋</p>
          </div>
        </div>
      )}
      <AnimatePresence initial={false}>{rendered}</AnimatePresence>
      <AnimatePresence>
        {typingUsers.length > 0 && <TypingIndicator key="typing" typingUsers={typingUsers} />}
      </AnimatePresence>
      <div ref={bottomRef} className="h-1" />
    </div>
  )
}
