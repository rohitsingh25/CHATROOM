/**
 * session.js — persists the user's room session in sessionStorage.
 *
 * sessionStorage is per-tab and clears when the tab is closed, which is
 * perfect for a temporary chat app. On page reload the tab keeps the data.
 *
 * Stored shape: { roomCode: string, username: string, savedAt: number }
 */

const KEY = 'rosy_session'
const MAX_AGE_MS = 12 * 60 * 60 * 1000   // 12 hours — mirrors backend timeout

export function saveSession(roomCode, username) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      roomCode,
      username,
      savedAt: Date.now(),
    }))
  } catch {
    // sessionStorage unavailable (private mode on some browsers)
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const { roomCode, username, savedAt } = JSON.parse(raw)
    // Discard sessions older than 12 hours
    if (Date.now() - savedAt > MAX_AGE_MS) {
      clearSession()
      return null
    }
    if (!roomCode || !username) return null
    return { roomCode, username }
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
