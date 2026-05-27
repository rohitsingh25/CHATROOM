import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import EmojiPicker from 'emoji-picker-react'
import api from '../../utils/api'
import { toast } from 'react-hot-toast'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export default function MessageInput({ onSendChat, onSendTyping, onSendFile, roomCode }) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef(null)
  const typingTimer = useRef(null)
  const isTypingRef = useRef(false)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'
  }, [text])

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return
    const handler = (e) => {
      if (!e.target.closest('[data-emoji-container]')) setShowEmoji(false)
    }
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [showEmoji])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSendChat(trimmed)
    setText('')
    stopTyping()
    textareaRef.current?.focus()
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    if (!isTypingRef.current) {
      isTypingRef.current = true
      onSendTyping(true)
    }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(stopTyping, 1500)
  }

  const stopTyping = () => {
    if (isTypingRef.current) {
      isTypingRef.current = false
      onSendTyping(false)
    }
    clearTimeout(typingTimer.current)
  }

  const uploadFile = async (file) => {
    if (file.size > MAX_FILE_BYTES) { toast.error('File exceeds 10 MB limit.'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('room_code', roomCode)
      const { data } = await api.post('/api/upload/', form)
      onSendFile({ file_url: data.file_url, file_name: data.file_name, file_type: data.file_type })
      toast.success('File shared!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((accepted) => {
    accepted.forEach(uploadFile)
    setIsDragging(false)
  }, [roomCode]) // eslint-disable-line

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    noClick: true,
    noKeyboard: true,
    maxSize: MAX_FILE_BYTES,
  })

  const canSend = text.trim().length > 0

  return (
    <div
      {...getRootProps()}
      className={`relative flex-shrink-0 safe-bottom transition-colors duration-200 ${isDragActive || isDragging ? 'dropzone-active' : ''}`}
    >
      <input {...getInputProps()} />

      {/* Drag overlay */}
      <AnimatePresence>
        {(isDragActive || isDragging) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[rgba(108,99,255,0.1)] border-2 border-dashed border-[rgba(108,99,255,0.5)] z-20"
          >
            <div className="text-center pointer-events-none">
              <div className="text-3xl mb-2">📎</div>
              <p className="text-[var(--accent-2)] font-semibold text-sm">Drop to share file</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            data-emoji-container
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-3 mb-2 z-30 shadow-2xl"
          >
            <EmojiPicker
              onEmojiClick={(e) => {
                setText(t => t + e.emoji)
                textareaRef.current?.focus()
              }}
              theme="dark"
              height={350}
              width={300}
              searchPlaceholder="Search emoji…"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main input bar ── */}
      <div className="px-3 py-3 bg-[rgba(7,7,13,0.95)] border-t border-[var(--border)] backdrop-blur-xl">
        {/* Glass input container — the entire pill */}
        <motion.div
          animate={{
            boxShadow: isFocused
              ? '0 0 0 2px rgba(108,99,255,0.35), 0 4px 24px rgba(0,0,0,0.4)'
              : '0 2px 12px rgba(0,0,0,0.25)',
          }}
          transition={{ duration: 0.2 }}
          className="flex items-end gap-1 bg-[rgba(255,255,255,0.055)] border border-[rgba(255,255,255,0.1)] rounded-2xl px-2 py-1.5"
        >
          {/* ── Attach button ── */}
          <motion.button
            id="btn-attach-file"
            onClick={openFilePicker}
            disabled={uploading}
            title="Attach file (max 10 MB)"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-2)] hover:bg-[rgba(108,99,255,0.12)] transition-colors disabled:opacity-40 mb-0.5"
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              )
            }
          </motion.button>

          {/* ── Textarea ── */}
          <div className="flex-1 min-w-0 py-1">
            <textarea
              id="chat-message-input"
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type a message…"
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] leading-relaxed block font-[inherit]"
              style={{ minHeight: '24px', maxHeight: '130px' }}
            />
          </div>

          {/* ── Emoji button ── */}
          <motion.button
            id="btn-emoji-picker"
            data-emoji-container
            onClick={() => setShowEmoji(v => !v)}
            title="Emoji"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-colors mb-0.5 ${
              showEmoji
                ? 'bg-[rgba(108,99,255,0.2)] text-[var(--accent-2)]'
                : 'text-[var(--text-muted)] hover:text-[var(--accent-2)] hover:bg-[rgba(108,99,255,0.12)]'
            }`}
          >
            😊
          </motion.button>

          {/* ── Send button ── */}
          <motion.button
            id="btn-send-message"
            onClick={handleSend}
            disabled={!canSend}
            title="Send (Enter)"
            whileHover={canSend ? { scale: 1.06 } : {}}
            whileTap={canSend ? { scale: 0.9 } : {}}
            animate={{
              background: canSend
                ? 'linear-gradient(135deg, #6c63ff 0%, #9b87f5 100%)'
                : 'rgba(255,255,255,0.06)',
              boxShadow: canSend
                ? '0 0 16px rgba(108,99,255,0.45), 0 2px 8px rgba(0,0,0,0.3)'
                : 'none',
            }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mb-0.5 disabled:cursor-not-allowed overflow-hidden"
          >
            <svg
              width="16" height="16"
              viewBox="0 0 24 24" fill="none"
              stroke={canSend ? 'white' : 'rgba(255,255,255,0.25)'}
              strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </motion.button>
        </motion.div>

        {/* Hint text */}
        <p className="text-[10px] text-[var(--text-muted)] text-center mt-1.5 opacity-60">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
