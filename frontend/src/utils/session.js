/**
 * session.js — persists the user's room session in sessionStorage.
 *
 * sessionStorage is per-tab and survives page reloads but clears when
 * the tab is closed — perfect for a temporary chat app.
 *
 * Stored shape:
 *   { roomCode, username, isCreator, savedAt }
 */

const KEY = 'rosy_session'
const MAX_AGE_MS = 12 * 60 * 60 * 1000   // 12 hours — mirrors backend timeout

export function saveSession(roomCode, username, isCreator = false) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      roomCode,
      username,
      isCreator,
      savedAt: Date.now(),
    }))
  } catch {
    // sessionStorage unavailable in some private modes — fail silently
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const { roomCode, username, isCreator, savedAt } = JSON.parse(raw)
    // Discard sessions older than 12 hours (matches backend room timeout)
    if (Date.now() - savedAt > MAX_AGE_MS) {
      clearSession()
      return null
    }
    if (!roomCode || !username) return null
    return { roomCode, username, isCreator: isCreator ?? false }
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
