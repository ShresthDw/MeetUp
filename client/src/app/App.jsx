import { useEffect, useState } from 'react'

import { AUTH_TOKEN_KEY } from '../config/env'
import { getCurrentUser } from '../features/auth/authApi'
import AuthScreen from '../features/auth/AuthScreen'
import VideoRoom from '../features/room/VideoRoom'

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      setChecking(false)
      return
    }

    getCurrentUser(token)
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(AUTH_TOKEN_KEY))
      .finally(() => setChecking(false))
  }, [])

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Loading…</div>
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setUser(null)
  }

  return <VideoRoom user={user} onLogout={logout} />
}
