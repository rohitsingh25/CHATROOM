import { create } from 'zustand'
import { saveSession, clearSession } from '../utils/session'

const useChatStore = create((set, get) => ({
  // Room
  roomCode: null,
  username: null,
  onlineUsers: [],
  onlineCount: 0,

  // Messages
  messages: [],

  // UI State
  typingUsers: [],   // usernames currently typing
  isConnected: false,
  isConnecting: false,
  connectionError: null,

  // Actions
  setRoom: (roomCode, username) => {
    // Persist to sessionStorage so page reloads restore the session
    saveSession(roomCode, username)
    set({ roomCode, username })
  },

  setConnected: (val) => set({ isConnected: val, isConnecting: false }),
  setConnecting: (val) => set({ isConnecting: val }),
  setConnectionError: (err) => set({ connectionError: err }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setOnlineUsers: (users, count) =>
    set({ onlineUsers: users, onlineCount: count }),

  updateOnlineCount: (count, username, action) =>
    set((state) => {
      const users =
        action === 'join'
          ? [...new Set([...state.onlineUsers, username])]
          : state.onlineUsers.filter((u) => u !== username)
      return { onlineCount: count, onlineUsers: users }
    }),

  setTyping: (username, isTyping) =>
    set((state) => {
      const without = state.typingUsers.filter((u) => u !== username)
      return { typingUsers: isTyping ? [...without, username] : without }
    }),

  clearRoom: () => {
    // Clear persisted session so a fresh start doesn't re-enter the old room
    clearSession()
    set({
      roomCode: null,
      username: null,
      onlineUsers: [],
      onlineCount: 0,
      messages: [],
      typingUsers: [],
      isConnected: false,
      isConnecting: false,
      connectionError: null,
    })
  },
}))

export default useChatStore
