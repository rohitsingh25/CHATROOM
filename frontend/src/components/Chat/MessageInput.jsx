import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import EmojiPicker from 'emoji-picker-react'
import axios from 'axios'
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
    ta.style.height = Math.min(ta.scrollHeight, 150) + 'px'
  }, [text])

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
      const { data } = await axios.post('/api/upload/', form)
      onSendFile({ file_url: data.file_url, file_name: data.file_name, file_type: data.file_type })
      toast.success('File uploaded!')
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

  const handleEmojiClick = (emojiData) => {
    setText((t) => t + emojiData.emoji)
    setShowEmoji(false)
    textareaRef.current?.focus()
  }

  return (
    <div
      {...getRootProps()}
      className={`relative border-t border-[var(--border)] bg-[rgba(10,10,15,0.9)] backdrop-blur-xl transition-colors duration-200 ${isDragActive || isDragging ? 'dropzone-active' : ''}`}
    >
      <input {...getInputProps()} />

      {/* Drag overlay */}
      <AnimatePresence>
        {(isDragActive || isDragging) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[rgba(108,99,255,0.1)] border-2 border-dashed border-[rgba(108,99,255,0.5)] z-20 rounded-t-xl"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📎</div>
              <p className="text-[var(--accent-2)] font-medium">Drop file to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-2 mb-2 z-30"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="dark"
              height={380}
              width={320}
              searchPlaceholder="Search emoji…"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 px-3 py-3">
        {/* Attach button */}
        <button
          id="btn-attach-file"
          onClick={openFilePicker}
          disabled={uploading}
          title="Attach file"
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-2)] hover:bg-[rgba(108,99,255,0.1)] transition-all disabled:opacity-40"
        >
          {uploading
            ? <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          }
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            className="input-glass w-full px-4 py-2.5 rounded-xl text-sm resize-none leading-relaxed"
            style={{ minHeight: '42px', maxHeight: '150px' }}
          />
        </div>

        {/* Emoji button */}
        <button
          id="btn-emoji-picker"
          onClick={() => setShowEmoji((v) => !v)}
          title="Emoji"
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg hover:bg-[rgba(108,99,255,0.1)] transition-all"
        >
          😊
        </button>

        {/* Send */}
        <button
          id="btn-send-message"
          onClick={handleSend}
          disabled={!text.trim()}
          title="Send"
          className="flex-shrink-0 w-9 h-9 rounded-xl btn-glow flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
