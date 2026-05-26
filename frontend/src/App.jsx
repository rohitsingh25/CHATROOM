import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import ChatRoom from './pages/ChatRoom'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(20,20,30,0.97)',
            color: '#f0f0ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/room/:code" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  )
}
