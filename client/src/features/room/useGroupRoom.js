import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_TRANSPORTS, SOCKET_URL } from '../../config/env'
import { useTheme } from '../../context/ThemeContext'

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

export function useGroupRoom() {
  const { theme, setTheme, registerThemeBroadcaster } = useTheme()

  const socket = useMemo(
    () =>
      io(SOCKET_URL, {
        autoConnect: true,
        transports: SOCKET_TRANSPORTS || ['websocket', 'polling'],
      }),
    []
  )

  const [status, setStatus] = useState('idle') // 'idle' | 'matching' | 'connected'
  const [roomId, setRoomId] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [connectedTime, setConnectedTime] = useState(0)
  const [streamReady, setStreamReady] = useState(0)
  const [peers, setPeers] = useState([]) // Array of { socketId, stream, isCameraOff, isMuted }
  const [syncedThemeNotice, setSyncedThemeNotice] = useState(null)

  const localVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const peersMapRef = useRef(new Map()) // socketId -> RTCPeerConnection
  const iceCandidatesMapRef = useRef(new Map()) // socketId -> Array<candidate>
  const roomIdRef = useRef('')
  const statusRef = useRef('idle')
  const themeRef = useRef(theme)
  const setThemeRef = useRef(setTheme)
  setThemeRef.current = setTheme

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    roomIdRef.current = roomId
  }, [roomId])

  const attachLocalStream = useCallback(() => {
    const stream = screenStreamRef.current || localStreamRef.current
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream
      localVideoRef.current.play().catch(() => {})
    }
  }, [])

  const initializeMedia = useCallback(async () => {
    if (localStreamRef.current) {
      const activeTracks = localStreamRef.current.getTracks().filter((t) => t.readyState === 'live')
      if (activeTracks.length > 0) {
        attachLocalStream()
        return localStreamRef.current
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      localStreamRef.current = stream
      setStreamReady((prev) => prev + 1)
      attachLocalStream()
      return stream
    } catch (err) {
      console.warn('Group media init error, trying fallback:', err.message)
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        localStreamRef.current = fallbackStream
        setStreamReady((prev) => prev + 1)
        attachLocalStream()
        return fallbackStream
      } catch (fallbackErr) {
        setError('Could not access camera/microphone. Please allow camera and mic permissions.')
        return null
      }
    }
  }, [attachLocalStream])

  const closePeer = useCallback((peerSocketId) => {
    const pc = peersMapRef.current.get(peerSocketId)
    if (pc) {
      pc.onicecandidate = null
      pc.ontrack = null
      pc.onnegotiationneeded = null
      pc.close()
      peersMapRef.current.delete(peerSocketId)
    }
    iceCandidatesMapRef.current.delete(peerSocketId)
    setPeers((prev) => prev.filter((p) => p.socketId !== peerSocketId))
  }, [])

  const closeAllPeers = useCallback(() => {
    peersMapRef.current.forEach((pc) => {
      pc.onicecandidate = null
      pc.ontrack = null
      pc.onnegotiationneeded = null
      pc.close()
    })
    peersMapRef.current.clear()
    iceCandidatesMapRef.current.clear()
    setPeers([])
  }, [])

  const drainIceCandidates = useCallback(async (peerSocketId, pc) => {
    const queue = iceCandidatesMapRef.current.get(peerSocketId) || []
    iceCandidatesMapRef.current.set(peerSocketId, [])
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.warn('Error applying group ICE candidate:', err.message)
      }
    }
  }, [])

  const createPeerConnection = useCallback(
    (targetSocketId) => {
      let pc = peersMapRef.current.get(targetSocketId)
      if (pc) return pc

      pc = new RTCPeerConnection({ iceServers })

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('relay-group-ice-candidate', {
            to: targetSocketId,
            candidate: event.candidate,
          })
        }
      }

      pc.ontrack = (event) => {
        const stream = (event.streams && event.streams[0]) || (event.track ? new MediaStream([event.track]) : null)
        if (stream) {
          setPeers((prev) => {
            const exists = prev.some((p) => p.socketId === targetSocketId)
            if (exists) {
              return prev.map((p) => (p.socketId === targetSocketId ? { ...p, stream } : p))
            }
            return [...prev, { socketId: targetSocketId, stream, isCameraOff: false, isMuted: false }]
          })
        }
      }

      // Add local media tracks
      const currentStream = screenStreamRef.current || localStreamRef.current
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, currentStream)
          } catch (err) {
            console.warn('Track add warning:', err.message)
          }
        })
      }

      peersMapRef.current.set(targetSocketId, pc)
      return pc
    },
    [socket]
  )

  const startGroupMatching = useCallback(async () => {
    setError('')
    closeAllPeers()
    statusRef.current = 'matching'
    setStatus('matching')
    setRoomId('')
    setRoomCode('')
    setMessages([])
    setConnectedTime(0)

    await initializeMedia()
    socket.emit('join-group-queue')
  }, [closeAllPeers, initializeMedia, socket])

  const createCustomGroup = useCallback(async () => {
    setError('')
    closeAllPeers()
    statusRef.current = 'matching'
    setStatus('matching')
    setRoomId('')
    setRoomCode('')
    setMessages([])
    setConnectedTime(0)

    await initializeMedia()
    socket.emit('create-custom-group')
  }, [closeAllPeers, initializeMedia, socket])

  const joinSpecificGroup = useCallback(
    async (codeOrId) => {
      setError('')
      closeAllPeers()
      statusRef.current = 'matching'
      setStatus('matching')
      setRoomId('')
      setRoomCode('')
      setMessages([])
      setConnectedTime(0)

      await initializeMedia()
      socket.emit('join-specific-group', { roomCode: codeOrId })
    },
    [closeAllPeers, initializeMedia, socket]
  )

  const nextGroup = useCallback(async () => {
    closeAllPeers()
    setMessages([])
    statusRef.current = 'matching'
    setStatus('matching')
    setRoomId('')
    setRoomCode('')
    setConnectedTime(0)

    await initializeMedia()
    socket.emit('next-group')
  }, [closeAllPeers, initializeMedia, socket])

  const leaveGroupRoom = useCallback(() => {
    closeAllPeers()
    statusRef.current = 'idle'
    setStatus('idle')
    setRoomId('')
    setRoomCode('')
    setMessages([])
    setConnectedTime(0)
    socket.emit('leave-group-room')
  }, [closeAllPeers, socket])

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return
    const audioTrack = localStreamRef.current.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      const newMuted = !audioTrack.enabled
      setIsMicMuted(newMuted)
      if (roomIdRef.current) {
        socket.emit('relay-group-status', {
          roomId: roomIdRef.current,
          isCameraOff,
          isMicMuted: newMuted,
        })
      }
    }
  }, [isCameraOff, socket])

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return
    const videoTrack = localStreamRef.current.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      const newCameraOff = !videoTrack.enabled
      setIsCameraOff(newCameraOff)
      if (roomIdRef.current) {
        socket.emit('relay-group-status', {
          roomId: roomIdRef.current,
          isCameraOff: newCameraOff,
          isMicMuted,
        })
      }
    }
  }, [isMicMuted, socket])

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
        screenStreamRef.current = null
      }
      setIsScreenSharing(false)

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0]
        peersMapRef.current.forEach((pc) => {
          const senders = pc.getSenders()
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
          if (videoSender && videoTrack) {
            videoSender.replaceTrack(videoTrack).catch(() => {})
          }
        })
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
        localVideoRef.current.play().catch(() => {})
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        })
        screenStreamRef.current = screenStream
        setIsScreenSharing(true)

        const screenTrack = screenStream.getVideoTracks()[0]
        peersMapRef.current.forEach((pc) => {
          const senders = pc.getSenders()
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
          if (videoSender && screenTrack) {
            videoSender.replaceTrack(screenTrack).catch(() => {})
          }
        })

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
          localVideoRef.current.play().catch(() => {})
        }

        screenTrack.onended = () => {
          toggleScreenShare()
        }
      } catch (err) {
        console.warn('Screen share failed/cancelled:', err)
      }
    }
  }, [isScreenSharing])

  const sendMessage = useCallback(
    (eventOrText, customSenderLabel) => {
      let text = ''
      if (typeof eventOrText === 'string') {
        text = eventOrText
      } else if (eventOrText && eventOrText.preventDefault) {
        eventOrText.preventDefault()
      }
      if (!text.trim() || !roomIdRef.current) return false

      socket.emit('send-group-message', {
        roomId: roomIdRef.current,
        message: text.trim(),
        senderLabel: customSenderLabel || 'You',
      })
      return true
    },
    [socket]
  )

  const createPeerConnectionRef = useRef(createPeerConnection)
  createPeerConnectionRef.current = createPeerConnection

  const drainIceCandidatesRef = useRef(drainIceCandidates)
  drainIceCandidatesRef.current = drainIceCandidates

  const closePeerRef = useRef(closePeer)
  closePeerRef.current = closePeer

  // Setup Socket listeners for Group WebRTC Mesh
  useEffect(() => {
    initializeMedia()

    socket.on('group-matched', async ({ roomId: matchedRoomId, roomCode: matchedRoomCode, members: existingMembers = [] }) => {
      setRoomId(matchedRoomId)
      setRoomCode(matchedRoomCode)
      roomIdRef.current = matchedRoomId
      statusRef.current = 'connected'
      setStatus('connected')
      setConnectedTime(0)

      // Initiator for each existing member in the room
      for (const memberSocketId of existingMembers) {
        if (memberSocketId && memberSocketId !== socket.id) {
          const pc = createPeerConnectionRef.current(memberSocketId)
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            })
            await pc.setLocalDescription(offer)
            socket.emit('relay-group-offer', { to: memberSocketId, offer })
          } catch (err) {
            console.error('Error creating group WebRTC offer for member:', memberSocketId, err)
          }
        }
      }
    })

    socket.on('group-peer-joined', ({ peerSocketId }) => {
      // A new peer joined the group. Ensure placeholder is created so grid updates
      if (peerSocketId && peerSocketId !== socket.id) {
        setPeers((prev) => {
          if (prev.some((p) => p.socketId === peerSocketId)) return prev
          return [...prev, { socketId: peerSocketId, stream: null, isCameraOff: false, isMuted: false }]
        })
      }
    })

    socket.on('group-webrtc-offer', async ({ from, offer }) => {
      if (!from || !offer) return
      try {
        const pc = createPeerConnectionRef.current(from)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        await drainIceCandidatesRef.current(from, pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('relay-group-answer', { to: from, answer })
      } catch (err) {
        console.error('Error handling group-webrtc-offer from:', from, err)
      }
    })

    socket.on('group-webrtc-answer', async ({ from, answer }) => {
      if (!from || !answer) return
      const pc = peersMapRef.current.get(from)
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
          await drainIceCandidatesRef.current(from, pc)
        } catch (err) {
          console.error('Error handling group-webrtc-answer from:', from, err)
        }
      }
    })

    socket.on('group-webrtc-ice-candidate', async ({ from, candidate }) => {
      if (!from || !candidate) return
      const pc = peersMapRef.current.get(from)
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.warn('Failed to add group ICE candidate:', err.message)
        }
      } else {
        const queue = iceCandidatesMapRef.current.get(from) || []
        queue.push(candidate)
        iceCandidatesMapRef.current.set(from, queue)
      }
    })

    socket.on('group-peer-left', ({ peerSocketId }) => {
      if (peerSocketId) {
        closePeerRef.current(peerSocketId)
      }
    })

    socket.on('group-peer-status-update', ({ peerSocketId, isCameraOff: peerCamOff, isMicMuted: peerMuted }) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === peerSocketId
            ? {
                ...p,
                isCameraOff: typeof peerCamOff === 'boolean' ? peerCamOff : p.isCameraOff,
                isMuted: typeof peerMuted === 'boolean' ? peerMuted : p.isMuted,
              }
            : p
        )
      )
    })

    socket.on('group-chat-message', (payload) => {
      setMessages((prev) => [...prev, payload])
    })

    socket.on('theme-synced', ({ theme: incomingTheme }) => {
      if (incomingTheme === 'dark' || incomingTheme === 'light') {
        setThemeRef.current(incomingTheme, { broadcast: false })
        setSyncedThemeNotice({ theme: incomingTheme, timestamp: Date.now() })
      }
    })

    socket.on('group-error', ({ reason }) => {
      setError(reason || 'Error joining group.')
      setStatus('idle')
    })

    return () => {
      socket.off('group-matched')
      socket.off('group-peer-joined')
      socket.off('group-webrtc-offer')
      socket.off('group-webrtc-answer')
      socket.off('group-webrtc-ice-candidate')
      socket.off('group-peer-left')
      socket.off('group-peer-status-update')
      socket.off('group-chat-message')
      socket.off('theme-synced')
      socket.off('group-error')
      closeAllPeers()
    }
  }, [socket, initializeMedia, closeAllPeers])

  // Sync theme changes with group when in an active connected room
  useEffect(() => {
    const unregister = registerThemeBroadcaster((newTheme) => {
      const currentRoomId = roomIdRef.current
      if (currentRoomId && statusRef.current === 'connected') {
        socket.emit('sync-theme', { roomId: currentRoomId, theme: newTheme })
      }
    })
    return () => unregister()
  }, [registerThemeBroadcaster, socket])

  // Timer counter
  useEffect(() => {
    if (status === 'connected') {
      const interval = setInterval(() => {
        setConnectedTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [status])

  return {
    socket,
    status,
    roomId,
    roomCode,
    messages,
    error,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    connectedTime,
    peers,
    localStream: localStreamRef.current,
    localVideoRef,
    syncedThemeNotice,
    streamReady,
    startGroupMatching,
    createCustomGroup,
    joinSpecificGroup,
    nextGroup,
    leaveGroupRoom,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    initializeMedia,
    attachLocalStream,
  }
}
