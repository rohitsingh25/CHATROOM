import { motion } from 'framer-motion'

export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers.length) return null

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : 'Several people are typing'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex items-center gap-2 px-4 py-1.5"
    >
      <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.05)] border border-[var(--border)] rounded-full px-3 py-1.5">
        <div className="flex gap-1 items-center">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="text-[var(--text-secondary)] text-xs ml-2">{label}</span>
      </div>
    </motion.div>
  )
}
