import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

import { SOCKET_TRANSPORTS, SOCKET_URL } from '../../config/env'
import { useTheme } from '../../context/ThemeContext'

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

export function useVideoRoom() {
  const { theme, setTheme, registerThemeBroadcaster } = useTheme()

  const socket = useMemo(() => io(SOCKET_URL, {
    autoConnect: true,
    transports: SOCKET_TRANSPORTS || ['websocket', 'polling'],
  }), [])

  const [status, setStatus] = useState('idle') // 'idle' | 'matching' | 'connected' | 'disconnected'
  const [roomId, setRoomId] = useState('')
  const [role, setRole] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [partnerDisconnected, setPartnerDisconnected] = useState(false)
  const [connectedTime, setConnectedTime] = useState(0)
  const [streamReady, setStreamReady] = useState(0)
  const [onlineCount, setOnlineCount] = useState(1)
  const [inRoomsCount, setInRoomsCount] = useState(0)
  const [remoteStream, setRemoteStream] = useState(null)
  const [syncedThemeNotice, setSyncedThemeNotice] = useState(null)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const peerRef = useRef(null)
  const iceCandidatesQueueRef = useRef([])
  const roomIdRef = useRef('')
  const statusRef = useRef('idle')
  const themeRef = useRef(theme)
  const timerRef = useRef(null)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  const closePeer = useCallback(() => {
    iceCandidatesQueueRef.current = []
    if (peerRef.current) {
      peerRef.current.onicecandidate = null
      peerRef.current.ontrack = null
      peerRef.current.onnegotiationneeded = null
      peerRef.current.close()
      peerRef.current = null
    }
    remoteStreamRef.current = null
    setRemoteStream(null)
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
  }, [])

  const drainIceCandidates = useCallback(async (peer) => {
    if (!peer || !peer.remoteDescription) return
    const queue = [...iceCandidatesQueueRef.current]
    iceCandidatesQueueRef.current = []
    for (const candidate of queue) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.warn('Failed to apply queued ICE candidate:', err.message)
      }
    }
  }, [])

  const ensurePeer = useCallback((activeRoomId) => {
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
      const stream = (event.streams && event.streams[0]) || (event.track ? new MediaStream([event.track]) : null)
      if (stream) {
        remoteStreamRef.current = stream
        setRemoteStream(stream)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
          remoteVideoRef.current.play().catch(() => {})
        }
      }
    }

    const currentStream = screenStreamRef.current || localStreamRef.current
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        try {
          peer.addTrack(track, currentStream)
        } catch (err) {
          console.warn('Track already added or addTrack failed:', err.message)
        }
      })
    }

    // Set HD bitrate parameters
    peer.onnegotiationneeded = async () => {
      try {
        const senders = peer.getSenders()
        senders.forEach((sender) => {
          if (sender.track && sender.track.kind === 'video') {
            const params = sender.getParameters()
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}]
            }
            params.encodings[0].maxBitrate = 2500000 // 2.5 Mbps HD crisp stream
            sender.setParameters(params).catch(() => {})
          }
        })
      } catch (err) {
        // silent
      }
    }

    peerRef.current = peer
    return peer
  }, [socket])

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
      // Natural Camera Constraints
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

      // If peer connection exists, ensure tracks are added
      if (peerRef.current) {
        const senders = peerRef.current.getSenders()
        stream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track && s.track.kind === track.kind)
          if (sender) {
            sender.replaceTrack(track).catch(() => {})
          } else {
            try {
              peerRef.current.addTrack(track, stream)
            } catch (err) {
              // ignore
            }
          }
        })
      }

      return stream
    } catch (err) {
      console.warn('Media access error/fallback:', err.message)
      // Fallback with basic constraints
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

  const startMatching = useCallback(async () => {
    setError('')
    setPartnerDisconnected(false)
    statusRef.current = 'matching'
    setStatus('matching')
    setRoomId('')
    roomIdRef.current = ''
    setRole('')
    setMessages([])
    setConnectedTime(0)
    setSyncedThemeNotice(null)
    closePeer()

    await initializeMedia()
    socket.emit('join-queue')
  }, [closePeer, initializeMedia, socket])

  const nextPeer = useCallback(async () => {
    setMessages([])
    setPartnerDisconnected(false)
    statusRef.current = 'matching'
    setStatus('matching')
    setRoomId('')
    roomIdRef.current = ''
    setConnectedTime(0)
    setSyncedThemeNotice(null)
    closePeer()
    await initializeMedia()
    socket.emit('next-peer')
  }, [closePeer, initializeMedia, socket])

  const leaveRoom = useCallback(() => {
    statusRef.current = 'idle'
    setStatus('idle')
    setRoomId('')
    roomIdRef.current = ''
    setRole('')
    setMessages([])
    setPartnerDisconnected(false)
    setConnectedTime(0)
    setSyncedThemeNotice(null)
    closePeer()
    socket.emit('leave-room')
  }, [closePeer, socket])

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return
    const audioTrack = localStreamRef.current.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setIsMicMuted(!audioTrack.enabled)
    }
  }, [])

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return
    const videoTrack = localStreamRef.current.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setIsCameraOff(!videoTrack.enabled)
    }
  }, [])

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share, restore camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
        screenStreamRef.current = null
      }
      setIsScreenSharing(false)

      if (localStreamRef.current && peerRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0]
        const senders = peerRef.current.getSenders()
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack)
        }
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
        localVideoRef.current.play().catch(() => {})
      }
    } else {
      // Start screen share
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
        if (peerRef.current) {
          const senders = peerRef.current.getSenders()
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
          if (videoSender && screenTrack) {
            videoSender.replaceTrack(screenTrack)
          }
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
          localVideoRef.current.play().catch(() => {})
        }

        screenTrack.onended = () => {
          toggleScreenShare()
        }
      } catch (err) {
        console.warn('Screen share cancelled/failed:', err)
      }
    }
  }, [isScreenSharing])

  const sendMessage = useCallback((eventOrText) => {
    let text = ''
    if (typeof eventOrText === 'string') {
      text = eventOrText
    } else if (eventOrText && eventOrText.preventDefault) {
      eventOrText.preventDefault()
    }
    if (!text.trim() || !roomIdRef.current) return false

    socket.emit('send-message', { roomId: roomIdRef.current, message: text.trim() })
    return true
  }, [socket])

  const ensurePeerRef = useRef(ensurePeer)
  ensurePeerRef.current = ensurePeer

  const closePeerRef = useRef(closePeer)
  closePeerRef.current = closePeer

  const drainIceCandidatesRef = useRef(drainIceCandidates)
  drainIceCandidatesRef.current = drainIceCandidates

  const setThemeRef = useRef(setTheme)
  setThemeRef.current = setTheme

  // Setup socket event listeners
  useEffect(() => {
    initializeMedia()

    if (socket.connected) {
      setError('')
    }

    socket.on('connect', () => {
      setError('')
    })

    socket.on('connect_error', () => {
      setError(`Could not connect to the server at ${SOCKET_URL}.`)
    })

    socket.on('matching', () => {
      statusRef.current = 'matching'
      setStatus('matching')
      setPartnerDisconnected(false)
    })

    socket.on('match-found', async ({ roomId: matchedRoomId, role: matchedRole }) => {
      if (statusRef.current === 'idle') {
        socket.emit('leave-room')
        return
      }

      setRoomId(matchedRoomId)
      roomIdRef.current = matchedRoomId
      setRole(matchedRole)
      statusRef.current = 'connected'
      setStatus('connected')
      setPartnerDisconnected(false)
      setConnectedTime(0)
      setSyncedThemeNotice(null)

      // Initiator triggers WebRTC offer and initial theme sync
      if (matchedRole === 'initiator') {
        const peer = ensurePeerRef.current(matchedRoomId)
        try {
          const offer = await peer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          })
          await peer.setLocalDescription(offer)
          socket.emit('relay-offer', { roomId: matchedRoomId, offer })
          socket.emit('sync-theme', { roomId: matchedRoomId, theme: themeRef.current })
        } catch (err) {
          console.error('Error creating WebRTC offer:', err)
        }
      }
    })

    socket.on('online-stats', (payload) => {
      if (typeof payload?.onlineCount === 'number') {
        setOnlineCount(payload.onlineCount)
      }
      if (typeof payload?.inRoomsCount === 'number') {
        setInRoomsCount(payload.inRoomsCount)
      }
    })

    socket.on('chat-message', (payload) => {
      setMessages((current) => [...current, payload])
    })

    socket.on('message-blocked', ({ reason }) => {
      setError(reason || 'Message was filtered by safety system.')
    })

    socket.on('peer-left', () => {
      setPartnerDisconnected(true)
      statusRef.current = 'disconnected'
      setStatus('disconnected')
      closePeerRef.current()
    })

    socket.on('webrtc-offer', async ({ offer }) => {
      const activeRoomId = roomIdRef.current
      if (!activeRoomId || !offer) return

      try {
        const peer = ensurePeerRef.current(activeRoomId)
        await peer.setRemoteDescription(new RTCSessionDescription(offer))
        await drainIceCandidatesRef.current(peer)
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        socket.emit('relay-answer', { roomId: activeRoomId, answer })
      } catch (err) {
        console.error('Error handling webrtc-offer:', err)
      }
    })

    socket.on('webrtc-answer', async ({ answer }) => {
      if (!answer || !peerRef.current) return
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        await drainIceCandidatesRef.current(peerRef.current)
      } catch (err) {
        console.error('Error handling webrtc-answer:', err)
      }
    })

    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      if (!candidate) return
      try {
        if (peerRef.current && peerRef.current.remoteDescription && peerRef.current.remoteDescription.type) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } else {
          iceCandidatesQueueRef.current.push(candidate)
        }
      } catch (err) {
        console.warn('Failed to apply ICE candidate:', err.message)
      }
    })

    socket.on('theme-synced', ({ theme: incomingTheme }) => {
      if (incomingTheme === 'dark' || incomingTheme === 'light') {
        setThemeRef.current(incomingTheme, { broadcast: false })
        setSyncedThemeNotice({ theme: incomingTheme, timestamp: Date.now() })
      }
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      closePeerRef.current()
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [socket, initializeMedia])

  // Sync theme changes with partner when in an active connected room
  useEffect(() => {
    const unregister = registerThemeBroadcaster((newTheme) => {
      const currentRoomId = roomIdRef.current
      if (currentRoomId && statusRef.current === 'connected') {
        socket.emit('sync-theme', { roomId: currentRoomId, theme: newTheme })
      }
    })
    return () => unregister()
  }, [registerThemeBroadcaster, socket])

  // Timer counter for active call
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
    role,
    messages,
    error,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    partnerDisconnected,
    connectedTime,
    onlineCount,
    inRoomsCount,
    localVideoRef,
    remoteVideoRef,
    localStream: localStreamRef.current,
    remoteStream,
    syncedThemeNotice,
    streamReady,
    startMatching,
    nextPeer,
    leaveRoom,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    initializeMedia,
    attachLocalStream,
  }
}

