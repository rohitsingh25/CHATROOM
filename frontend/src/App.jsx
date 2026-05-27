import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import ChatRoom from './pages/ChatRoom'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminWatchRoom from './pages/AdminWatchRoom'
import NotFound from './pages/NotFound'
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
        <Route path="/"            element={<Home />} />
        <Route path="/create"      element={<CreateRoom />} />
        <Route path="/join"        element={<JoinRoom />} />
        <Route path="/room/:code"  element={<ChatRoom />} />
        <Route path="/admin/login"      element={<AdminLogin />} />
        <Route path="/admin/dashboard"  element={<AdminDashboard />} />
        <Route path="/admin/watch/:code" element={<AdminWatchRoom />} />
        {/* Catch-all — any unknown URL shows a beautiful 404 page */}
        <Route path="*"            element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
