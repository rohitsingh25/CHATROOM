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
  const textareaRef = useRef(null)
  const typingTimer = useRef(null)
  const isTypingRef = useRef(false)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
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
      className={`relative flex-shrink-0 border-t border-[var(--border)] bg-[rgba(7,7,13,0.92)] backdrop-blur-xl safe-bottom transition-colors duration-200 ${isDragActive || isDragging ? 'dropzone-active' : ''}`}
    >
      <input {...getInputProps()} />

      {/* Drag overlay */}
      <AnimatePresence>
        {(isDragActive || isDragging) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[rgba(108,99,255,0.1)] border-2 border-dashed border-[rgba(108,99,255,0.5)] z-20 rounded-t-xl"
          >
            <div className="text-center pointer-events-none">
              <div className="text-3xl mb-2">📎</div>
              <p className="text-[var(--accent-2)] font-medium text-sm">Drop file to share</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            data-emoji-container
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-2 mb-2 z-30"
          >
            <EmojiPicker
              onEmojiClick={(e) => {
                setText(t => t + e.emoji)
                textareaRef.current?.focus()
              }}
              theme="dark"
              height={360}
              width={300}
              searchPlaceholder="Search emoji…"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="flex items-end gap-1.5 px-3 py-2.5">
        {/* Attach */}
        <button
          id="btn-attach-file"
          onClick={openFilePicker}
          disabled={uploading}
          title="Attach file"
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-2)] hover:bg-[rgba(108,99,255,0.1)] transition-all disabled:opacity-40"
        >
          {uploading
            ? <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
          }
        </button>

        {/* Textarea */}
        <div className="flex-1 relative min-w-0">
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="input-glass w-full px-3.5 py-2.5 rounded-xl text-sm resize-none leading-relaxed block"
            style={{ minHeight: '40px', maxHeight: '140px' }}
          />
        </div>

        {/* Emoji */}
        <button
          id="btn-emoji-picker"
          data-emoji-container
          onClick={() => setShowEmoji(v => !v)}
          title="Emoji"
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base hover:bg-[rgba(108,99,255,0.1)] transition-all ${showEmoji ? 'bg-[rgba(108,99,255,0.15)]' : ''}`}
        >
          😊
        </button>

        {/* Send */}
        <motion.button
          id="btn-send-message"
          onClick={handleSend}
          disabled={!canSend}
          title="Send (Enter)"
          whileTap={{ scale: 0.92 }}
          className="flex-shrink-0 w-9 h-9 rounded-xl btn-glow flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:transform-none disabled:shadow-none"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </motion.button>
      </div>
    </div>
  )
}
