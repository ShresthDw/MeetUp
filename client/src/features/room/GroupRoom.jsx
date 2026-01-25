import { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  RotateCw,
  X,
  MessageSquare,
  Lightbulb,
  Radio,
  Send,
  Flag,
  Users,
  Shield,
  Smile,
  Zap,
  Copy,
  Check,
  Share2,
  Maximize2,
  Minimize2,
  UserPlus,
} from 'lucide-react'
import PendantThemeToggle from '../../components/PendantThemeToggle'

const ICEBREAKERS = [
  "What's the best movie or show you've watched recently?",
  "If you could travel anywhere right now, where would you go?",
  "What is your favorite late-night snack?",
  "What's an unusual hobby or interest you have?",
  "What music are you listening to on repeat these days?",
  "If you won a million dollars tomorrow, what's the first thing you'd buy?",
  "Coffee or Tea? And how do you take it?",
  "What's something exciting you're currently working on?",
]

const EMOJI_REACTIONS = ['❤️', '🔥', '😂', '👍', '🎉', '🚀', '😮', '👏', '😍', '💯']

const EXPANDED_EMOJIS = [
  '❤️', '🔥', '😂', '👍', '🎉', '🚀', '😮', '👏', '😍', '💯',
  '😎', '🥳', '🙌', '✨', '⚡', '👀', '🤯', '🍕', '☕', '💡'
]

function RemotePeerVideo({ peer, index, isSpotlight, onToggleSpotlight }) {
  const videoRef = useRef(null)
  const [aspectRatio, setAspectRatio] = useState(null)

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream
      videoRef.current.play().catch(() => {})
    }
  }, [peer.stream])

  const label = `Stranger #${index + 1}`

  return (
    <div
      onClick={onToggleSpotlight}
      className={`relative group flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-300 dark:border-[#243c47] bg-[#0d171d] shadow-xl transition-all duration-300 ${
        isSpotlight ? 'h-full w-full' : 'h-full w-full cursor-pointer hover:border-[#964f26]/70 hover:scale-[1.01]'
      }`}
    >
      {peer.isCameraOff || !peer.stream ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900/90 text-slate-400 p-4 space-y-2">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#15252e] text-slate-300 border border-[#243c47] shadow-inner">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-[#964f26]" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-300">{label}</span>
          <span className="text-[10px] text-slate-500">Camera is off</span>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          onLoadedMetadata={(e) => {
            if (e.target.videoWidth && e.target.videoHeight) {
              setAspectRatio(e.target.videoWidth / e.target.videoHeight)
            }
          }}
          onResize={(e) => {
            if (e.target.videoWidth && e.target.videoHeight) {
              setAspectRatio(e.target.videoWidth / e.target.videoHeight)
            }
          }}
          className="h-full w-full bg-[#080e12] object-contain"
        />
      )}

      {/* Top Overlay Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-lg bg-black/75 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-white border border-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-[#964f26] animate-pulse" />
        <span>{label}</span>
        {peer.isMuted && <MicOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400 ml-1" />}
      </div>

      {/* Expand/Spotlight Hover Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleSpotlight()
        }}
        className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur border border-white/10"
        title={isSpotlight ? 'Exit Spotlight' : 'Spotlight Participant'}
      >
        {isSpotlight ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export default function GroupRoom({ user, preferences, room, onLeaveRoom }) {
  const [inputText, setInputText] = useState('')
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportedSuccess, setReportedSuccess] = useState(false)
  const [flyingEmojis, setFlyingEmojis] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const [copiedToast, setCopiedToast] = useState(false)
  const [spotlightPeerId, setSpotlightPeerId] = useState(null) // null = Grid View | 'local' or socketId
  const messagesEndRef = useRef(null)

  const {
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
    localStream,
    localVideoRef,
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
    attachLocalStream,
  } = room

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Explicitly ensure local video stream is attached & playing
  useEffect(() => {
    attachLocalStream?.()
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch(() => {})
    }
  }, [localStream, streamReady, attachLocalStream, localVideoRef])

  // Trigger floating emoji animation
  const triggerFlyEmoji = (emoji, isPeer = false) => {
    const id = `${Date.now()}-${Math.random()}`
    const xOffset = Math.random() * 80 - 40
    const rot = Math.random() * 30 - 15
    const xMid = (Math.random() - 0.5) * 40
    const xFinal = (Math.random() - 0.5) * 60

    setFlyingEmojis((prev) => [
      ...prev.slice(-30),
      { id, emoji, xOffset, rot, xMid, xFinal, isPeer },
    ])

    setTimeout(() => {
      setFlyingEmojis((prev) => prev.filter((item) => item.id !== id))
    }, 1600)
  }

  // Trigger emoji on incoming peer message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg && lastMsg.sender !== room.socket?.id) {
        const text = lastMsg.text?.trim()
        if (text && text.length <= 6) {
          triggerFlyEmoji(text, true)
        }
      }
    }
  }, [messages, room.socket?.id])

  // Handle hotkeys (Space for next group, M for mic, V for cam)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

      if (e.code === 'Space') {
        e.preventDefault()
        nextGroup()
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMic()
      } else if (e.key === 'v' || e.key === 'V') {
        toggleCamera()
      } else if (e.key === 'Escape') {
        handleExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextGroup, toggleMic, toggleCamera])

  const handleExit = () => {
    leaveGroupRoom()
    onLeaveRoom()
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return
    const senderName = user?.username || 'You'
    if (sendMessage(inputText, senderName)) {
      if (inputText.trim().length <= 6) {
        triggerFlyEmoji(inputText.trim(), false)
      }
      setInputText('')
      setShowEmojiPicker(false)
    }
  }

  const handleEmojiClick = (emoji) => {
    triggerFlyEmoji(emoji, false)
    if (status === 'connected') {
      sendMessage(emoji, user?.username || 'You')
    }
  }

  const handleInsertIcebreaker = () => {
    const randomQuestion = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]
    setInputText(randomQuestion)
  }

  const handleCopyInviteLink = () => {
    const code = roomCode || roomId
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(code)}`
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 2600)
    }).catch(() => {
      navigator.clipboard.writeText(code)
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 2600)
    })
  }

  const handleReport = (reason) => {
    setReportedSuccess(true)
    setTimeout(() => {
      setReportModalOpen(false)
      setReportedSuccess(false)
      nextGroup()
    }, 1400)
  }

  const totalParticipants = peers.length + 1

  // Dynamic Grid Class Calculator
  const getGridClass = () => {
    if (spotlightPeerId) return 'grid-cols-1'
    if (totalParticipants === 1) return 'grid-cols-1'
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2'
    if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2'
    return 'grid-cols-2 md:grid-cols-3'
  }

  return (
    <div className="relative flex flex-1 flex-col h-[100dvh] overflow-hidden bg-slate-100 dark:bg-[#101b22] select-none">
      {/* Group Room Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-[#243c47] bg-white/95 dark:bg-[#142229]/95 px-3 sm:px-6 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-lamp-badge text-white shadow-md">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Group Lounge
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {totalParticipants} {totalParticipants === 1 ? 'PERSON' : 'PEOPLE'}
              </span>
            </div>

            {roomCode && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Code: <strong className="text-[#964f26]">{roomCode}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Center / Right Header Action Items */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-[#243c47] bg-slate-100 dark:bg-[#1a2d36] hover:bg-slate-200 dark:hover:bg-[#243c47] text-slate-800 dark:text-slate-100 px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Copy shareable link & room code"
            >
              {copiedToast ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5 text-[#964f26]" />}
              <span className="hidden xs:inline">{copiedToast ? 'Copied Link!' : 'Invite Friends'}</span>
            </button>
          )}

          <PendantThemeToggle />

          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1a2d36] text-slate-500 hover:text-red-500 hover:bg-red-500/10 dark:text-slate-400 dark:hover:text-red-400 transition cursor-pointer"
            title="Safety & Report"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Split Layout: Video Grid + Group Chat */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Copy Toast Notification */}
        {copiedToast && (
          <div className="pointer-events-none absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-emerald-500/50 bg-slate-950/90 text-emerald-300 px-4 py-1.5 text-xs font-bold shadow-2xl backdrop-blur-xl animate-bounce">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Invite link copied! Share with friends to join this group.</span>
          </div>
        )}

        {/* Video Grid Stage Area */}
        <div className="relative flex flex-1 flex-col items-center justify-center p-2 sm:p-4 overflow-hidden bg-slate-100 dark:bg-[#142229]">
          
          {/* Main Grid Wrapper */}
          <div className="relative flex flex-1 w-full max-w-6xl h-full max-h-[calc(100dvh-130px)] items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-300 dark:border-[#243c47] bg-[#080e12] p-2 sm:p-3 shadow-2xl">
            
            {/* Grid Container */}
            <div className={`grid ${getGridClass()} gap-2 sm:gap-3 w-full h-full auto-rows-fr`}>
              
              {/* Local User Tile */}
              {(!spotlightPeerId || spotlightPeerId === 'local') && (
                <div
                  onClick={() => setSpotlightPeerId(spotlightPeerId === 'local' ? null : 'local')}
                  className={`relative group flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-300 dark:border-[#243c47] bg-[#0d171d] shadow-xl transition-all duration-300 ${
                    spotlightPeerId === 'local' ? 'h-full w-full' : 'h-full w-full cursor-pointer hover:border-[#964f26]/70 hover:scale-[1.01]'
                  }`}
                >
                  {isCameraOff && !isScreenSharing ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900/90 text-slate-400 p-4 space-y-2">
                      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#15252e] text-slate-300 border border-[#243c47] shadow-inner">
                        <CameraOff className="h-6 w-6 sm:h-7 sm:w-7 text-slate-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-300">You</span>
                      <span className="text-[10px] text-slate-500">Camera is off</span>
                    </div>
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`h-full w-full bg-[#080e12] object-contain ${
                        !isScreenSharing ? '-scale-x-100' : ''
                      }`}
                    />
                  )}

                  {/* Top Badge */}
                  <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-lg bg-black/75 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-white border border-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{isScreenSharing ? 'Your Screen' : 'You (Host)'}</span>
                    {isMicMuted && <MicOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400 ml-1" />}
                  </div>

                  {/* Spotlight Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSpotlightPeerId(spotlightPeerId === 'local' ? null : 'local')
                    }}
                    className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur border border-white/10"
                    title={spotlightPeerId === 'local' ? 'Exit Spotlight' : 'Spotlight You'}
                  >
                    {spotlightPeerId === 'local' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}

              {/* Remote Peer Video Tiles */}
              {peers.map((peer, idx) => {
                if (spotlightPeerId && spotlightPeerId !== peer.socketId) return null
                return (
                  <RemotePeerVideo
                    key={peer.socketId}
                    peer={peer}
                    index={idx}
                    isSpotlight={spotlightPeerId === peer.socketId}
                    onToggleSpotlight={() =>
                      setSpotlightPeerId(spotlightPeerId === peer.socketId ? null : peer.socketId)
                    }
                  />
                )
              })}

              {/* Waiting For Group Members Card (When 1 person in room) */}
              {peers.length === 0 && !spotlightPeerId && (
                <div className="relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-[#964f26]/40 bg-[#0d171d]/80 backdrop-blur-sm p-4 sm:p-6 text-center space-y-3">
                  <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-[#964f26]/30 animate-radar" />
                    <div className="absolute inset-0 rounded-full border border-[#964f26]/50 animate-radar-delayed-1" />
                    <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-lamp-badge text-white shadow-lg">
                      <Radio className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-1 max-w-xs">
                    <h4 className="font-display text-sm sm:text-base font-black text-white uppercase tracking-wide">
                      Waiting for Group Members…
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      Matching strangers or share the room code below with friends!
                    </p>
                  </div>

                  {roomCode && (
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="btn-lamp-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-white" />
                      <span>Copy Code ({roomCode})</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Floating Controls Bar */}
            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-300 dark:border-[#243c47] bg-white/95 dark:bg-[#101e25]/95 p-1 sm:p-1.5 shadow-2xl backdrop-blur-xl whitespace-nowrap">
              <button
                type="button"
                onClick={nextGroup}
                className="btn-lamp-primary flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer"
                title="Next Group (Space)"
              >
                <RotateCw className="h-3.5 w-3.5 text-white" />
                <span className="text-white font-bold">Next</span>
                <span className="hidden md:inline-block rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-mono text-white">
                  Space
                </span>
              </button>

              <div className="h-5 w-px bg-slate-200 dark:bg-[#243c47]" />

              <button
                type="button"
                onClick={toggleMic}
                title={isMicMuted ? 'Unmute Mic (M)' : 'Mute Mic (M)'}
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition cursor-pointer ${
                  !isMicMuted
                    ? 'bg-slate-100 dark:bg-[#1a2d36] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-[#243c47]'
                    : 'bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30'
                }`}
              >
                {!isMicMuted ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                title={isCameraOff ? 'Turn Camera On (V)' : 'Turn Camera Off (V)'}
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition cursor-pointer ${
                  !isCameraOff
                    ? 'bg-slate-100 dark:bg-[#1a2d36] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-[#243c47]'
                    : 'bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30'
                }`}
              >
                {!isCameraOff ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={toggleScreenShare}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                className={`hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition cursor-pointer ${
                  isScreenSharing
                    ? 'btn-lamp-primary text-white font-bold shadow-md'
                    : 'bg-slate-100 dark:bg-[#1a2d36] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#243c47] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ScreenShare className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                title="Invite Friends"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1a2d36] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#243c47] transition cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
                title="Toggle Group Chat"
                className={`md:hidden flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${
                  isMobileChatOpen
                    ? 'btn-lamp-primary text-white font-bold'
                    : 'bg-slate-100 dark:bg-[#1a2d36] text-slate-700 dark:text-slate-300'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
              </button>

              <div className="h-5 w-px bg-slate-200 dark:bg-[#243c47]" />

              <button
                type="button"
                onClick={handleExit}
                title="Leave Group (Esc)"
                className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-red-600 px-3 sm:px-3.5 text-xs font-bold text-white hover:bg-red-500 transition shadow-md shadow-red-600/20 cursor-pointer"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Leave</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Group Chat Sidebar */}
        <div
          className={`${
            isMobileChatOpen ? 'flex fixed inset-x-0 bottom-0 top-14 z-50' : 'hidden md:flex'
          } w-full md:w-80 lg:w-96 flex-col border-l border-slate-200 dark:border-[#243c47] bg-white/98 dark:bg-[#101e25]/98 backdrop-blur-2xl transition-all duration-300 shadow-2xl`}
        >
          {/* Chat Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-[#243c47] px-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Group Chat</span>
              <span className="rounded bg-slate-200 dark:bg-[#1a2d36] px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                {totalParticipants}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInsertIcebreaker}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#243c47] bg-slate-100 hover:bg-slate-200 dark:bg-[#122027] dark:hover:bg-[#1a2d36] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer"
                title="Generate an icebreaker question"
              >
                <Lightbulb className="h-3 w-3 text-[#964f26] dark:text-[#964f26]" />
                <span>Icebreaker</span>
              </button>

              {isMobileChatOpen && (
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1a2d36] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Message Log */}
          <div className="relative flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-transparent">
            {/* Flying Emojis Overlay */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
              {flyingEmojis.map((item) => (
                <div
                  key={item.id}
                  style={{
                    left: `calc(${item.isPeer ? '25%' : '70%'} + ${item.xOffset}px)`,
                    bottom: '24px',
                    '--fly-rot': `${item.rot}deg`,
                    '--fly-x-mid': `${item.xMid}px`,
                    '--fly-x-final': `${item.xFinal}px`,
                  }}
                  className="absolute animate-fly-above text-4xl select-none"
                >
                  {item.emoji}
                </div>
              ))}
            </div>

            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-4 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1a2d36] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#243c47]">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium">Say hi to everyone in the group!</p>
              </div>
            ) : (
              messages.map((item, idx) => {
                const isYou = item.sender === room.socket?.id
                return (
                  <div key={`${item.createdAt}-${idx}`} className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-1 px-1 font-medium">
                      {isYou ? 'You' : item.senderLabel || 'Stranger'}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs break-words ${
                        isYou
                          ? 'bg-[#964f26] text-white font-medium rounded-br-none shadow-xs'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200 dark:bg-[#1a2d36] dark:text-slate-100 dark:border-[#243c47]'
                      }`}
                    >
                      {item.text}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Bar */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#122027] px-2 py-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 w-full justify-between">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-lg hover:scale-130 hover:bg-slate-200 dark:hover:bg-[#1a2d36] active:scale-95 transition-all duration-150 cursor-pointer"
                  title={`Send ${emoji}`}
                >
                  <span className="leading-none select-none">{emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Drawer */}
          {showEmojiPicker && (
            <div className="border-t border-slate-200 dark:border-[#243c47] bg-slate-100 dark:bg-[#15252e] p-2 backdrop-blur-xl">
              <div className="grid grid-cols-5 gap-1 max-h-36 overflow-y-auto p-1">
                {EXPANDED_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji)
                      triggerFlyEmoji(emoji, false)
                    }}
                    className="flex h-8 items-center justify-center rounded-lg text-lg hover:bg-slate-200 dark:hover:bg-[#1a2d36] hover:scale-120 active:scale-95 transition cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-200 dark:border-[#243c47] p-3 flex gap-2 items-center bg-white dark:bg-[#101e25]">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                showEmojiPicker
                  ? 'border-slate-300 dark:border-[#243c47] bg-slate-200 dark:bg-[#1a2d36] text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-[#243c47] bg-slate-100 dark:bg-[#122027] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smile className="h-4 w-4" />
            </button>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message the group..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#122027] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#964f26] transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="btn-lamp-primary flex h-8 w-8 items-center justify-center rounded-xl text-white transition disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </form>
        </div>
      </div>

      {/* Safety Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500 dark:text-red-400" />
              <span>Report Group Room</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select a reason for reporting. You will be automatically disconnected and moved to another group.
            </p>

            {reportedSuccess ? (
              <div className="rounded-xl bg-slate-100 dark:bg-[#122027] border border-slate-200 dark:border-[#243c47] p-3 text-xs text-slate-700 dark:text-slate-300 text-center font-medium">
                Report submitted. Finding a new group…
              </div>
            ) : (
              <div className="space-y-2">
                {['Inappropriate Content / Behavior', 'Spam / Scam', 'Harassment or Hate Speech', 'Underage User'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleReport(reason)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-300 transition cursor-pointer"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
