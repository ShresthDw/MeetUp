import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

import { SOCKET_TRANSPORT, SOCKET_URL } from '../../config/env'

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

export function useVideoRoom() {
  const socket = useMemo(() => io(SOCKET_URL, {
    autoConnect: true,
    transports: [SOCKET_TRANSPORT],
    upgrade: SOCKET_TRANSPORT !== 'polling',
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

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const peerRef = useRef(null)
  const roomIdRef = useRef('')
  const timerRef = useRef(null)

  const closePeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close()
      peerRef.current = null
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
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    const currentStream = screenStreamRef.current || localStreamRef.current
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        peer.addTrack(track, currentStream)
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
      attachLocalStream()
      return localStreamRef.current
    }

    try {
      const isMobile = typeof window !== 'undefined' && (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768)

      // Natural Camera Constraints (Preserves native sensor aspect ratio without forced digital crop zoom)
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
      console.warn('Media access error/fallback:', err.message)
      // Fallback with basic constraints if HD rejected
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
    setStatus('matching')
    setRoomId('')
    roomIdRef.current = ''
    setRole('')
    setMessages([])
    setConnectedTime(0)
    closePeer()

    await initializeMedia()
    socket.emit('join-queue')
  }, [closePeer, initializeMedia, socket])

  const nextPeer = useCallback(() => {
    setMessages([])
    setPartnerDisconnected(false)
    setStatus('matching')
    setConnectedTime(0)
    closePeer()
    socket.emit('next-peer')
  }, [closePeer, socket])

  const leaveRoom = useCallback(() => {
    socket.emit('leave-room')
    closePeer()
    setStatus('idle')
    setRoomId('')
    roomIdRef.current = ''
    setRole('')
    setMessages([])
    setPartnerDisconnected(false)
    setConnectedTime(0)
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
      // Start screen share with native full display resolution
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

  useEffect(() => {
    let mounted = true

    initializeMedia()

    socket.on('connect', () => {
      setError('')
    })

    socket.on('connect_error', () => {
      setError(`Could not connect to the server at ${SOCKET_URL}.`)
    })

    socket.on('matching', () => {
      setStatus('matching')
      setPartnerDisconnected(false)
    })

    socket.on('match-found', async ({ roomId: matchedRoomId, role: matchedRole }) => {
      setRoomId(matchedRoomId)
      roomIdRef.current = matchedRoomId
      setRole(matchedRole)
      setStatus('connected')
      setPartnerDisconnected(false)
      setConnectedTime(0)

      if (matchedRole === 'initiator') {
        const peer = ensurePeer(matchedRoomId)
        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
        await peer.setLocalDescription(offer)
        socket.emit('relay-offer', { roomId: matchedRoomId, offer })
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
      setStatus('disconnected')
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
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer))
      }
    })

    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      try {
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.warn('Failed to apply ICE candidate:', err.message)
      }
    })

    return () => {
      mounted = false
      socket.removeAllListeners()
      socket.disconnect()
      closePeer()
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [socket, closePeer, ensurePeer, initializeMedia])

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
