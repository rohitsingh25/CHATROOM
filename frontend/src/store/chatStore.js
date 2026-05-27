import { create } from 'zustand'
import { saveSession, clearSession } from '../utils/session'

const useChatStore = create((set) => ({
  // Room
  roomCode:   null,
  username:   null,
  isCreator:  false,   // true only for the user who first joined the room
  onlineUsers: [],
  onlineCount: 0,

  // Messages
  messages: [],

  // UI State
  typingUsers:     [],
  isConnected:     false,
  isConnecting:    false,
  connectionError: null,

  // ── Actions ─────────────────────────────────────────────

  setRoom: (roomCode, username, isCreator = false) => {
    saveSession(roomCode, username, isCreator)
    set({ roomCode, username, isCreator })
  },

  setCreator: (val) => {
    set({ isCreator: val })
    // Also persist so page reload retains creator status
  },

  setConnected:      (val) => set({ isConnected: val, isConnecting: false }),
  setConnecting:     (val) => set({ isConnecting: val }),
  setConnectionError: (err) => set({ connectionError: err }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setMessages: (messages) => set({ messages }),

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
    clearSession()
    set({
      roomCode:        null,
      username:        null,
      isCreator:       false,
      onlineUsers:     [],
      onlineCount:     0,
      messages:        [],
      typingUsers:     [],
      isConnected:     false,
      isConnecting:    false,
      connectionError: null,
    })
  },
}))

export default useChatStore
