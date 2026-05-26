import { motion, AnimatePresence } from 'framer-motion'
import useChatStore from '../../store/chatStore'
import { formatTime, formatDate, isImage } from '../../utils/formatters'
import { useEffect, useRef, useState } from 'react'
import TypingIndicator from './TypingIndicator'

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

function SystemMessage({ content }) {
  return (
    <div className="flex justify-center px-4 py-1">
      <span className="text-xs text-[var(--text-muted)] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-full px-3 py-1">{content}</span>
    </div>
  )
}

// tiny hook placeholder — lightbox handled by window.open
function useLightbox() { return [null, () => {}] }

/** Force-download a URL to the OS downloads folder via fetch → blob → anchor */
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
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'done'

  return (
    <button
      id={`btn-download-${fileName}`}
      onClick={(e) => { e.stopPropagation(); downloadFile(fileUrl, fileName, setStatus); }}
      disabled={status === 'loading'}
      title={`Download ${fileName}`}
      className="
        flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
        bg-[rgba(0,0,0,0.35)] backdrop-blur-sm border border-[rgba(255,255,255,0.15)]
        text-white hover:bg-[rgba(108,99,255,0.5)] hover:border-[rgba(108,99,255,0.6)]
        transition-all duration-200 disabled:opacity-60
      "
    >
      {status === 'loading' ? (
        <div className="w-3 h-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
      ) : status === 'done' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      )}
      {status === 'done' ? 'Saved!' : status === 'loading' ? 'Saving…' : 'Download'}
    </button>
  )
}

function MessageBubble({ msg, own }) {
  const [hovered, setHovered] = useState(false)
  const [lightbox, setLightbox] = useLightbox()
  const isFile = msg.message_type === 'image' || msg.message_type === 'file' ||
                 msg.type === 'file'
  const imgFile = isFile && isImage(msg.file_type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${own ? 'justify-end' : 'justify-start'} px-4`}
    >
      <div className={`max-w-[75%] flex flex-col gap-1 ${own ? 'items-end' : 'items-start'}`}>
        {!own && (
          <span className="text-xs text-[var(--text-muted)] ml-1">{msg.username}</span>
        )}

        <div
          className={`relative ${own ? 'msg-own px-4 py-2.5' : 'msg-other px-4 py-2.5'}`}
          onMouseEnter={() => isFile && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {msg.message_type === 'text' || msg.type === 'chat' ? (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
          ) : imgFile ? (
            <div className="relative group">
              <img
                src={msg.file_url}
                alt={msg.file_name}
                className="max-w-[260px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity block"
                onClick={() => window.open(msg.file_url, '_blank')}
              />
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-2 right-2"
                  >
                    <DownloadButton fileUrl={msg.file_url} fileName={msg.file_name} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[rgba(108,99,255,0.2)] border border-[rgba(108,99,255,0.3)] flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <a
                  href={msg.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium underline underline-offset-2 opacity-90 hover:opacity-100 break-all"
                >
                  {msg.file_name}
                </a>
              </div>
              <DownloadButton fileUrl={msg.file_url} fileName={msg.file_name} />
            </div>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-muted)] px-1">{formatTime(msg.timestamp)}</span>
      </div>
    </motion.div>
  )
}

export default function ChatWindow() {
  const { messages, typingUsers, username } = useChatStore()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const rendered = []
  let lastDate = null
  messages.forEach((msg) => {
    const dateLabel = formatDate(msg.timestamp)
    if (dateLabel && dateLabel !== lastDate) {
      lastDate = dateLabel
      rendered.push(<DateSeparator key={`date-${msg.timestamp}`} label={dateLabel} />)
    }
    if (msg.type === 'system') {
      rendered.push(<SystemMessage key={msg.id} content={msg.content} />)
    } else {
      rendered.push(
        <MessageBubble
          key={msg.id}
          msg={msg}
          own={msg.own || msg.username === username}
        />
      )
    }
  })

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-4">
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4 mt-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.2)] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(108,99,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">No messages yet — say hello! 👋</p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {rendered}
      </AnimatePresence>

      <AnimatePresence>
        {typingUsers.length > 0 && <TypingIndicator key="typing" typingUsers={typingUsers} />}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  )
}
