import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useChatStore from '../store/chatStore'
import { useWebSocket } from '../hooks/useWebSocket'
import RoomHeader from '../components/Room/RoomHeader'
import ChatWindow from '../components/Chat/ChatWindow'
import MessageInput from '../components/Chat/MessageInput'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { username, isConnected, isConnecting, clearRoom } = useChatStore()

  // If user refreshed or navigated directly, redirect to join with prefilled code
  useEffect(() => {
    if (!username) {
      navigate(`/join?code=${code}`, { replace: true })
    }
  }, []) // eslint-disable-line

  const { sendChat, sendTyping, sendFile } = useWebSocket(code, username)

  const handleLeave = () => {
    clearRoom()
    navigate('/')
  }

  return (
    <div className="full-height flex flex-col bg-[var(--bg-primary)] overflow-hidden relative">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[rgba(108,99,255,0.055)] blur-[130px]" />
        <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-[rgba(167,139,250,0.045)] blur-[110px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-0">
        <RoomHeader roomCode={code} onLeave={handleLeave} />

        {/* Connecting / reconnecting banner */}
        <AnimatePresence>
          {!isConnected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="connecting-banner">
                <div className="w-3 h-3 border-[1.5px] border-[var(--accent-2)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>{isConnecting ? 'Connecting to room…' : 'Lost connection — reconnecting…'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area — flex-1 + min-h-0 to prevent overflow pushing input off screen */}
        <div className="flex flex-col flex-1 min-h-0">
          <ChatWindow />
          <MessageInput
            onSendChat={sendChat}
            onSendTyping={sendTyping}
            onSendFile={sendFile}
            roomCode={code}
          />
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(14,14,24,0.97)',
            color: '#eeeeff',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '12px',
            fontSize: '13px',
            padding: '10px 14px',
            maxWidth: '320px',
          },
        }}
      />
    </div>
  )
}
