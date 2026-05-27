import axios from 'axios'

// In production (Vercel), VITE_API_BASE_URL is set to the Render backend URL.
// In development, it's empty so the Vite proxy (/api → localhost:8000) is used.
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL,
  withCredentials: false,
})

export default api
