import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useChatStore from '../store/chatStore'
import { useWebSocket } from '../hooks/useWebSocket'
import RoomHeader from '../components/Room/RoomHeader'
import ChatWindow from '../components/Chat/ChatWindow'
import MessageInput from '../components/Chat/MessageInput'
import { Toaster } from 'react-hot-toast'

export default function ChatRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { roomCode, username, isConnected, clearRoom } = useChatStore()

  // If user refreshed or navigated directly, redirect home
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
      {/* Subtle bg gradient */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[rgba(108,99,255,0.06)] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[rgba(167,139,250,0.05)] blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <RoomHeader roomCode={code} onLeave={handleLeave} />
        <ChatWindow />
        <MessageInput onSendChat={sendChat} onSendTyping={sendTyping} onSendFile={sendFile} roomCode={code} />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(20,20,30,0.95)',
            color: '#f0f0ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  )
}
