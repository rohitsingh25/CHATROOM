import { motion, AnimatePresence } from 'framer-motion'
import useChatStore from '../../store/chatStore'
import { formatTime, formatDate, isImage } from '../../utils/formatters'
import { useEffect, useRef, useState } from 'react'
import TypingIndicator from './TypingIndicator'

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 my-1">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider px-2 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

function SystemMessage({ content }) {
  return (
    <div className="flex justify-center px-4 py-1 my-0.5">
      <span className="text-[11px] text-[var(--text-muted)] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-full px-3 py-1 max-w-[80%] text-center break-words">
        {content}
      </span>
    </div>
  )
}

async function downloadFile(url, filename, setStatus) {
  setStatus('loading')
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error('Network error')
    const blob = await resp.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
    setStatus('done')
    setTimeout(() => setStatus('idle'), 2000)
  } catch {
    setStatus('idle')
  }
}

function DownloadButton({ fileUrl, fileName }) {
  const [status, setStatus] = useState('idle')
  return (
    <button
      id={`btn-download-${fileName}`}
      onClick={(e) => { e.stopPropagation(); downloadFile(fileUrl, fileName, setStatus) }}
      disabled={status === 'loading'}
      title={`Download ${fileName}`}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgba(0,0,0,0.3)] backdrop-blur-sm border border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(108,99,255,0.45)] hover:border-[rgba(108,99,255,0.55)] transition-all disabled:opacity-60"
    >
      {status === 'loading' ? (
        <div className="w-3 h-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
      ) : status === 'done' ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      )}
      {status === 'done' ? 'Saved!' : status === 'loading' ? 'Saving…' : 'Download'}
    </button>
  )
}

function Avatar({ name }) {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#9b87f5] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 self-end mb-1">
      {name?.[0]?.toUpperCase()}
    </div>
  )
}

function MessageBubble({ msg, own, showAvatar }) {
  const [hovered, setHovered] = useState(false)
  const isFile = msg.message_type === 'image' || msg.message_type === 'file' || msg.type === 'file'
  const imgFile = isFile && isImage(msg.file_type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 px-3 sm:px-4 ${own ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar for others */}
      {!own && (showAvatar ? <Avatar name={msg.username} /> : <div className="w-7 flex-shrink-0" />)}

      <div className={`flex flex-col gap-1 ${own ? 'items-end' : 'items-start'} min-w-0`}
           style={{ maxWidth: 'min(75%, 420px)' }}>
        {/* Username label for others */}
        {!own && showAvatar && (
          <span className="text-[11px] text-[var(--text-muted)] ml-1 font-medium truncate max-w-full">
            {msg.username}
          </span>
        )}

        <div
          className={`relative w-full ${own ? 'msg-own' : 'msg-other'}`}
          onMouseEnter={() => isFile && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Text message */}
          {(msg.message_type === 'text' || msg.type === 'chat') && (
            <p className="text-sm leading-relaxed px-4 py-2.5 break-words whitespace-pre-wrap">
              {msg.content}
            </p>
          )}

          {/* Image */}
          {isFile && imgFile && (
            <div className="relative group p-1.5">
              <img
                src={msg.file_url}
                alt={msg.file_name}
                className="max-w-full w-[240px] sm:w-[280px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity block"
                onClick={() => window.open(msg.file_url, '_blank')}
              />
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-3 right-3"
                  >
                    <DownloadButton fileUrl={msg.file_url} fileName={msg.file_name} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Generic file */}
          {isFile && !imgFile && (
            <div className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[rgba(108,99,255,0.18)] border border-[rgba(108,99,255,0.3)] flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <span className="text-sm font-medium opacity-90 break-all min-w-0 leading-snug">
                  {msg.file_name}
                </span>
              </div>
              <DownloadButton fileUrl={msg.file_url} fileName={msg.file_name} />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-[var(--text-muted)] px-1 flex-shrink-0">
          {formatTime(msg.timestamp)}
        </span>
      </div>

      {/* Spacer on right for own messages (no avatar) */}
      {own && <div className="w-1 flex-shrink-0" />}
    </motion.div>
  )
}

export default function ChatWindow() {
  const { messages, typingUsers, username } = useChatStore()
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // Build rendered list — group consecutive messages from same user
  const rendered = []
  let lastDate = null
  let lastUsername = null

  messages.forEach((msg, idx) => {
    const dateLabel = formatDate(msg.timestamp)
    if (dateLabel && dateLabel !== lastDate) {
      lastDate = dateLabel
      lastUsername = null // reset grouping after date separator
      rendered.push(<DateSeparator key={`date-${msg.id}`} label={dateLabel} />)
    }

    if (msg.type === 'system') {
      lastUsername = null
      rendered.push(<SystemMessage key={msg.id} content={msg.content} />)
    } else {
      const own = msg.own || msg.username === username
      // Show avatar + name only when the sender changes
      const showAvatar = msg.username !== lastUsername
      lastUsername = msg.username

      rendered.push(
        <MessageBubble
          key={msg.id}
          msg={msg}
          own={own}
          showAvatar={showAvatar}
        />
      )
    }
  })

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto flex flex-col gap-1 py-3 overscroll-contain"
    >
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.18)] flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(108,99,255,0.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-sm font-medium">No messages yet</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">Say hello to start the conversation 👋</p>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {rendered}
      </AnimatePresence>

      <AnimatePresence>
        {typingUsers.length > 0 && (
          <TypingIndicator key="typing" typingUsers={typingUsers} />
        )}
      </AnimatePresence>

      <div ref={bottomRef} className="h-2" />
    </div>
  )
}
