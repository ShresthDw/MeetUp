import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

import { SOCKET_TRANSPORT, SOCKET_URL } from '../../config/env'

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function useVideoRoom() {
  const socket = useMemo(() => io(SOCKET_URL, {
    autoConnect: true,
    transports: [SOCKET_TRANSPORT],
    upgrade: SOCKET_TRANSPORT !== 'polling',
  }), [])

  const [status, setStatus] = useState('disconnected')
  const [roomId, setRoomId] = useState('')
  const [role, setRole] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerRef = useRef(null)
  const roomIdRef = useRef('')

  const closePeer = () => {
    peerRef.current?.close()
    peerRef.current = null
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
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]
    }

    localStreamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current)
    })

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

  const nextPeer = () => {
    setMessages([])
    setStatus('matching')
    closePeer()
    socket.emit('next-peer')
  }

  const sendMessage = (event, text) => {
    event.preventDefault()
    if (!text.trim() || !roomId) return false

    socket.emit('send-message', { roomId, message: text.trim() })
    return true
  }

  useEffect(() => {
    let mounted = true

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      })
      .catch(() => setError('Could not access camera or microphone. Check browser permissions.'))

    socket.on('connect', () => {
      setStatus('disconnected')
      setError('')
    })
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

    socket.on('chat-message', (payload) => setMessages((current) => [...current, payload]))
    socket.on('message-blocked', ({ reason }) => setError(reason || 'Message blocked'))
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
      if (peerRef.current) await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    })

    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      try {
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        setError('Failed to apply ICE candidate')
      }
    })

    return () => {
      mounted = false
      socket.removeAllListeners()
      socket.disconnect()
      closePeer()
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [socket])

  return {
    socket,
    status,
    roomId,
    role,
    messages,
    error,
    localVideoRef,
    remoteVideoRef,
    startMatching,
    nextPeer,
    sendMessage,
  }
}
