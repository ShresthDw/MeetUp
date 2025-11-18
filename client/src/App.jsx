import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Something went wrong.')
      localStorage.setItem('omagle-token', data.token)
      onAuthenticated(data.user)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fef3c7,#f8fafc_50%,#dbeafe)] p-4 text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">O</div>
          <h1 className="font-serif text-3xl font-bold">Welcome to MeetUp</h1>
          <p className="mt-2 text-sm text-slate-500">Meet someone new, safely and instantly.</p>
        </div>
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          {['login', 'register'].map((item) => (
            <button key={item} onClick={() => { setMode(item); setError('') }} className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${mode === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {item}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && <label className="block text-sm font-medium">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="Your name" /></label>}
          <label className="block text-sm font-medium">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="you@example.com" /></label>
          <label className="block text-sm font-medium">Password<input required type="password" minLength={mode === 'register' ? 8 : undefined} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /></label>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">{loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
      </section>
    </main>
  )
}

function VideoRoom({ user, onLogout }) {
  const socket = useMemo(() => io(SOCKET_URL, { autoConnect: true }), [])

  const [status, setStatus] = useState('disconnected')
  const [roomId, setRoomId] = useState('')
  const [role, setRole] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerRef = useRef(null)
  const roomIdRef = useRef('')

  const appendMessage = (payload) => {
    setMessages((prev) => [...prev, payload])
  }

  const closePeer = () => {
    if (peerRef.current) {
      peerRef.current.close()
      peerRef.current = null
    }
  }

  const ensurePeer = (activeRoomId) => {
    if (peerRef.current) return peerRef.current

    const peer = new RTCPeerConnection({ iceServers })

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('relay-ice-candidate', {
          roomId: activeRoomId,
          candidate: event.candidate,
        })
      }
    }

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current)
      })
    }

    peerRef.current = peer
    return peer
  }

  const startMatching = () => {
    setStatus('matching')
    setRoomId('')
    roomIdRef.current = ''
    setRole('')
    setMessages([])
    setError('')
    closePeer()
    socket.emit('join-queue')
  }

  const sendMessage = (event) => {
    event.preventDefault()
    if (!text.trim() || !roomId) return

    socket.emit('send-message', {
      roomId,
      message: text.trim(),
    })
    setText('')
  }

  const nextPeer = () => {
    setMessages([])
    setStatus('matching')
    closePeer()
    socket.emit('next-peer')
  }

  useEffect(() => {
    let mounted = true

    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (!mounted) return

        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (mediaError) {
        setError('Could not access camera or microphone. Check browser permissions.')
      }
    }

    setupMedia()

    socket.on('connect', () => { setStatus('disconnected'); setError('') })
    socket.on('connect_error', () => setError(`Could not connect to the MeetUp server at ${SOCKET_URL}.`))
    socket.on('matching', () => setStatus('matching'))

    socket.on('match-found', async ({ roomId: matchedRoomId, role: matchedRole }) => {
      setRoomId(matchedRoomId)
      roomIdRef.current = matchedRoomId
      setRole(matchedRole)
      setStatus('connected')

      if (matchedRole === 'initiator') {
        const peer = ensurePeer(matchedRoomId)
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        socket.emit('relay-offer', { roomId: matchedRoomId, offer })
      }
    })

    socket.on('chat-message', (payload) => {
      appendMessage(payload)
    })

    socket.on('message-blocked', ({ reason }) => {
      setError(reason || 'Message blocked')
    })

    socket.on('peer-left', () => {
      setStatus('disconnected')
      setRoomId('')
      roomIdRef.current = ''
      setRole('')
      setMessages([])
      closePeer()
    })

    socket.on('webrtc-offer', async ({ offer }) => {
      const activeRoomId = roomIdRef.current
      if (!activeRoomId) return

      const peer = ensurePeer(activeRoomId)
      await peer.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      socket.emit('relay-answer', { roomId: activeRoomId, answer })
    })

    socket.on('webrtc-answer', async ({ answer }) => {
      if (!peerRef.current) return
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    })

    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      if (!peerRef.current) return
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        setError('Failed to apply ICE candidate')
      }
    })

    return () => {
      mounted = false
      socket.removeAllListeners()
      socket.disconnect()
      closePeer()

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [socket])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,#f8fafc_50%,#dbeafe)] p-4 text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">MeetUp</h1>
            <p className="text-sm text-slate-600">Status: {status} {role ? `| ${role}` : ''}</p>
          </div>
          <div className="flex gap-2">
            <span className="hidden self-center text-sm text-slate-500 sm:inline">Hi, {user.name}</span>
            <button
              onClick={startMatching}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Join Queue
            </button>
            <button
              onClick={nextPeer}
              disabled={status !== 'connected'}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next Peer
            </button>
            <button onClick={onLogout} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Log out
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full rounded-2xl bg-slate-900 object-cover" />
          <video ref={remoteVideoRef} autoPlay playsInline className="aspect-video w-full rounded-2xl bg-slate-900 object-cover" />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm text-slate-600">Room: {roomId || 'not connected'}</p>
          <div className="mb-3 h-56 overflow-y-auto rounded-xl bg-white p-2">
            {messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
            {messages.map((message, index) => (
              <div key={`${message.createdAt}-${index}`} className="mb-2 text-sm">
                <strong>{message.sender === socket.id ? 'You' : 'Peer'}:</strong> {message.text}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type a message"
              className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
            />
            <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">
              Send
            </button>
          </form>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>
      </section>
    </main>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('omagle-token')
    if (!token) { setChecking(false); return }
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('omagle-token'))
      .finally(() => setChecking(false))
  }, [])

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Loading…</div>
  if (!user) return <AuthScreen onAuthenticated={setUser} />
  return <VideoRoom user={user} onLogout={() => { localStorage.removeItem('omagle-token'); setUser(null) }} />
}
