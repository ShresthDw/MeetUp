import { useEffect, useState } from 'react'
import { AUTH_TOKEN_KEY } from '../config/env'
import { getCurrentUser } from '../features/auth/authApi'
import Navbar from '../components/Navbar'
import AuthModal from '../features/auth/AuthModal'
import HomePage from '../features/home/HomePage'
import VideoRoom from '../features/room/VideoRoom'
import { useVideoRoom } from '../features/room/useVideoRoom'

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentView, setCurrentView] = useState('home') // 'home' | 'room'
  const [authModal, setAuthModal] = useState({ isOpen: false, initialMode: 'login' })
  const [preferences, setPreferences] = useState({
    mode: 'video',
    interests: [],
    cameraActive: true,
    micActive: true,
  })

  const room = useVideoRoom()

  // Check saved session on mount (non-blocking)
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setCheckingAuth(false)
      return
    }

    getCurrentUser(token)
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(AUTH_TOKEN_KEY))
      .finally(() => setCheckingAuth(false))
  }, [])

  const handleStartChat = (chatPreferences) => {
    setPreferences(chatPreferences)
    setCurrentView('room')
    room.startMatching()
  }

  const handleLeaveRoom = () => {
    room.leaveRoom()
    setCurrentView('home')
  }

  const handleOpenAuth = (mode = 'login') => {
    setAuthModal({ isOpen: true, initialMode: mode })
  }

  const handleCloseAuth = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }))
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar is visible on Home view */}
      {currentView === 'home' && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          onOpenAuth={handleOpenAuth}
          onNavigate={(v) => setCurrentView(v)}
        />
      )}

      {/* Main Content Area */}
      {currentView === 'home' ? (
        <HomePage
          user={user}
          onStartChat={handleStartChat}
          onOpenAuth={handleOpenAuth}
        />
      ) : (
        <VideoRoom
          user={user}
          preferences={preferences}
          room={room}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* Auth Modal (Non-blocking login/register) */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.initialMode}
        onClose={handleCloseAuth}
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser)
          handleCloseAuth()
        }}
      />
    </div>
  )
}
