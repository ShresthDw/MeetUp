export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '')
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000').replace(/\/+$/, '')
export const SOCKET_TRANSPORTS = ['websocket', 'polling']
export const AUTH_TOKEN_KEY = 'meetup-token'

