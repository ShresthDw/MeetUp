import { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  RotateCw,
  PhoneOff,
  MessageSquare,
  Sparkles,
  Send,
  Flag,
  Users,
  Shield,
  Clock,
  ArrowRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  Zap,
  ThumbsUp,
  Heart,
  Smile,
  Flame,
  Rocket
} from 'lucide-react'

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

export default function VideoRoom({ user, preferences, room, onLeaveRoom }) {
  const [inputText, setInputText] = useState('')
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportedSuccess, setReportedSuccess] = useState(false)
  const [isSwapped, setIsSwapped] = useState(false) // false: Remote is Big, Local is Small | true: Local is Big, Remote is Small
  const [flyingEmojis, setFlyingEmojis] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const messagesEndRef = useRef(null)

  const {
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
    localVideoRef,
    remoteVideoRef,
    localStream,
    streamReady,
    startMatching,
    nextPeer,
    leaveRoom,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    attachLocalStream,
  } = room

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Trigger floating/flying emoji animation
  const triggerFlyEmoji = (emoji, isPeer = false) => {
    const id = `${Date.now()}-${Math.random()}`
    const xOffset = Math.random() * 80 - 40 // random -40 to +40 px
    const rot = Math.random() * 30 - 15 // -15 to +15 deg
    const xMid = (Math.random() - 0.5) * 40
    const xFinal = (Math.random() - 0.5) * 60

    setFlyingEmojis((prev) => [
      ...prev.slice(-30),
      { id, emoji, xOffset, rot, xMid, xFinal, isPeer }
    ])

    setTimeout(() => {
      setFlyingEmojis((prev) => prev.filter((item) => item.id !== id))
    }, 1600)
  }

  // Trigger flying emoji when peer sends an emoji or short reaction
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

  // Explicitly ensure local video stream is attached & playing
  useEffect(() => {
    attachLocalStream?.()
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch(() => {})
    }
  }, [localStream, streamReady, attachLocalStream, localVideoRef])

  // Handle hotkeys (Space for next peer, M for mic, V for cam)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

      if (e.code === 'Space') {
        e.preventDefault()
        nextPeer()
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
  }, [nextPeer, toggleMic, toggleCamera])

  const handleExit = () => {
    leaveRoom()
    onLeaveRoom()
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return
    if (sendMessage(inputText)) {
      // If user typed a short emoji message, fly it too
      if (inputText.trim().length <= 6) {
        triggerFlyEmoji(inputText.trim(), false)
      }
      setInputText('')
      setShowEmojiPicker(false)
    }
  }

  const handleToggleScreenShare = async () => {
    const willShare = !isScreenSharing
    await toggleScreenShare()
    if (willShare) {
      setIsSwapped(true)
    }
  }

  const handleEmojiClick = (emoji) => {
    triggerFlyEmoji(emoji, false)
    if (status === 'connected') {
      sendMessage(emoji)
    }
  }

  const handleInsertIcebreaker = () => {
    const randomQuestion = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]
    setInputText(randomQuestion)
  }

  const handleReport = (reason) => {
    setReportedSuccess(true)
    setTimeout(() => {
      setReportModalOpen(false)
      setReportedSuccess(false)
      nextPeer()
    }, 1000)
  }

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="relative flex h-screen h-[100dvh] w-screen flex-col bg-[#142229] text-slate-100 overflow-hidden select-none">
      
      {/* Top Floating Header - Leo Cerso Style */}
      <header className="z-30 flex h-13 sm:h-14 items-center justify-between border-b border-[#243c47] bg-[#101e25]/95 px-2.5 sm:px-4 backdrop-blur-xl shrink-0">
        {/* Left: Brand & Room status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-1 sm:gap-2 rounded-xl bg-[#1a2d36] border border-[#243c47] px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-[#E09800]/50 transition cursor-pointer"
          >
            <span>←</span>
            <span className="hidden sm:inline">Exit to Lobby</span>
            <span className="sm:hidden">Exit</span>
          </button>

          <div className="flex items-center gap-2 border-l border-[#243c47] pl-2 sm:pl-3">
            {status === 'connected' ? (
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Connected</span>
                <span className="font-mono text-emerald-300 font-bold">{formatTime(connectedTime)}</span>
              </div>
            ) : status === 'matching' ? (
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#E09800]/15 border border-[#E09800]/40 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs text-[#E09800] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#E09800] animate-ping shrink-0" />
                <span>Matching…</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#1a2d36] px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs text-slate-400 border border-[#243c47]">
                <span className="h-2 w-2 rounded-full bg-slate-600 shrink-0" />
                <span>Idle</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Next, Mobile Chat & Report actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Chat Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
            className={`md:hidden flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              isMobileChatOpen
                ? 'border-[#E09800] bg-[#E09800]/20 text-[#E09800]'
                : 'border-[#243c47] bg-[#1a2d36] text-slate-300'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#E09800]" />
            <span className="hidden xs:inline">Chat</span>
            {messages.length > 0 && (
              <span className="rounded-full bg-[#E09800] text-[9px] text-white px-1.5 py-0.2 font-black leading-tight">
                {messages.length}
              </span>
            )}
          </button>

          {status === 'connected' && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1 rounded-xl border border-[#243c47] bg-[#1a2d36] px-2.5 sm:px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:border-red-500/30 transition cursor-pointer"
              title="Report User"
            >
              <Flag className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Report</span>
            </button>
          )}

          <button
            onClick={nextPeer}
            style={{ backgroundColor: '#E09800', color: '#ffffff', border: '1px solid #FFB82E' }}
            className="btn-yellow-primary flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#E09800] hover:bg-[#C78600] px-3 sm:px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-[#E09800]/30 hover:brightness-105 transition active:scale-95 cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-white" />
            <span className="text-white font-bold">Next</span>
            <span className="hidden sm:inline text-white font-bold">Stranger</span>
            <span className="hidden sm:inline-block rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono text-white">
              Space
            </span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Video Area + Real-Time Chat */}
      <div className="relative flex flex-1 overflow-hidden">
        
        {/* Video Stage Area */}
        <div className="relative flex flex-1 flex-col items-center justify-center p-1.5 sm:p-4 overflow-hidden bg-[#142229]">
          
          {/* Main Stage Container (Vertical Portrait on Mobile, Wide on Desktop) */}
          <div className="relative flex h-full w-full max-w-md sm:max-w-5xl items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-[#243c47] bg-[#1a2d36] shadow-2xl">
            
            {/* ========================================================================= */}
            {/* WRAPPER 1: REMOTE STRANGER (Never unmounted, smoothly swaps position)      */}
            {/* ========================================================================= */}
            <div
              onClick={() => {
                if (isSwapped) setIsSwapped(false)
              }}
              className={`transition-all duration-300 ${
                !isSwapped
                  ? 'absolute inset-0 h-full w-full overflow-hidden bg-[#0d171d] flex items-center justify-center z-10'
                  : 'absolute bottom-16 right-3 sm:bottom-4 sm:right-4 z-40 h-48 w-34 sm:h-44 sm:w-60 md:h-48 md:w-64 overflow-hidden rounded-2xl border-2 border-[#243c47] hover:border-[#E09800] bg-[#0d171d] shadow-2xl backdrop-blur-xl cursor-pointer hover:scale-102 transition-transform'
              }`}
            >
              {/* Remote Stranger Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`h-full w-full bg-[#0d171d] ${
                  !isSwapped ? 'object-cover sm:object-contain' : 'object-cover'
                } transition-opacity duration-300 ${
                  status === 'connected' && !partnerDisconnected ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Status Overlay on Stranger Feed when NOT connected */}
              {status === 'matching' && (
                isSwapped ? (
                  /* Compact Mini PiP Overlay */
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d171d]/95 p-2 text-center select-none space-y-1">
                    <div className="relative mb-0.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#E09800] shadow-md shadow-[#E09800]/40 text-white">
                      <Sparkles className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-white animate-pulse" />
                      <span className="absolute -inset-1 rounded-xl border border-[#E09800]/60 animate-ping opacity-30 pointer-events-none" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Searching…
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tap to enlarge
                    </span>
                  </div>
                ) : (
                  /* Full Stage Overlay */
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d171d]/95 backdrop-blur-md p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
                    <div className="relative flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center aspect-square">
                      <div className="absolute inset-0 rounded-full border border-[#E09800]/30 animate-radar" />
                      <div className="absolute inset-0 rounded-full border border-[#E09800]/50 animate-radar-delayed-1" />
                      <div className="relative flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#E09800] shadow-xl shadow-[#E09800]/35 text-white">
                        <Sparkles className="h-5 w-5 sm:h-7 sm:w-7 fill-white animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-1 max-w-xs px-2">
                      <h4 className="font-display text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-wide">
                        Searching for a stranger…
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        Connecting via HD WebRTC.
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExit()
                      }}
                      className="rounded-xl border border-[#243c47] bg-[#1a2d36] hover:bg-[#243c47] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )
              )}

              {/* Partner Left Overlay */}
              {partnerDisconnected && (
                isSwapped ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d171d]/95 p-2 text-center select-none space-y-1">
                    <div className="mb-0.5 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
                      <PhoneOff className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-red-400">Disconnected</span>
                    <span className="text-[10px] text-slate-400">Tap for next</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d171d]/90 backdrop-blur-sm p-4 sm:p-6 text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <PhoneOff className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display text-sm sm:text-base font-bold text-white">Stranger disconnected</h4>
                      <p className="text-xs text-slate-400">Press Space to connect with someone new.</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        nextPeer()
                      }}
                      style={{ backgroundColor: '#E09800', color: '#ffffff', border: '1px solid #FFB82E' }}
                      className="btn-yellow-primary flex items-center gap-2 rounded-xl bg-[#E09800] hover:bg-[#C78600] px-4 py-2 text-xs font-bold text-white hover:brightness-105 transition shadow cursor-pointer"
                    >
                      <RotateCw className="h-3.5 w-3.5 text-white" />
                      <span className="text-white font-bold">Find Next (Space)</span>
                    </button>
                  </div>
                )
              )}

              {/* Idle Overlay */}
              {status === 'idle' && (
                isSwapped ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d171d]/95 p-2 text-center select-none space-y-1">
                    <div className="mb-0.5 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#E09800]/15 text-[#E09800] border border-[#E09800]/30">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-white">Ready</span>
                    <span className="text-[10px] text-slate-400">Tap to start</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d171d]/90 backdrop-blur-sm p-4 sm:p-6 text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E09800]/15 text-[#E09800] border border-[#E09800]/30">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display text-sm sm:text-base font-bold text-white">Ready to Connect</h4>
                      <p className="text-xs text-slate-400">Click below to start matchmaking.</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startMatching()
                      }}
                      style={{ backgroundColor: '#E09800', color: '#ffffff', border: '1px solid #FFB82E' }}
                      className="btn-yellow-primary flex items-center gap-2 rounded-xl bg-[#E09800] hover:bg-[#C78600] px-5 py-2 text-xs font-bold text-white hover:brightness-105 transition shadow cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 fill-white text-white" />
                      <span className="text-white font-bold">Join Match Queue</span>
                    </button>
                  </div>
                )
              )}

              {/* Badges on Remote Stranger */}
              {!isSwapped ? (
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 rounded-lg bg-[#101e25]/85 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-white border border-white/10">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#E09800] animate-pulse" />
                  <span>Stranger</span>
                </div>
              ) : (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-md bg-[#101e25]/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur border border-white/10 pointer-events-none">
                  <span>Stranger</span>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* WRAPPER 2: LOCAL USER / SCREEN (Never unmounted, smoothly swaps position)   */}
            {/* ========================================================================= */}
            <div
              onClick={() => {
                if (!isSwapped) setIsSwapped(true)
              }}
              className={`transition-all duration-300 ${
                isSwapped
                  ? 'absolute inset-0 h-full w-full overflow-hidden bg-[#0d171d] flex items-center justify-center z-10'
                  : 'absolute bottom-16 right-3 sm:bottom-4 sm:right-4 z-40 h-48 w-34 sm:h-44 sm:w-60 md:h-48 md:w-64 overflow-hidden rounded-2xl border-2 border-[#243c47] hover:border-[#E09800] bg-[#0d171d] shadow-2xl backdrop-blur-xl cursor-pointer hover:scale-102 transition-transform'
              }`}
            >
              {isCameraOff && !isScreenSharing ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[#15252e] text-slate-500 p-2">
                  <CameraOff className={isSwapped ? "h-10 w-10 sm:h-12 sm:w-12 mb-2 text-slate-400" : "h-6 w-6 mb-1 text-slate-400"} />
                  <span className={isSwapped ? "text-xs sm:text-sm font-medium" : "text-xs font-medium"}>Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`h-full w-full bg-[#0d171d] ${
                    isScreenSharing
                      ? 'object-contain'
                      : isSwapped
                      ? 'object-contain sm:object-cover'
                      : 'object-cover'
                  } ${!isScreenSharing ? '-scale-x-100' : ''}`}
                />
              )}

              {/* Badges on Local User Feed */}
              {isSwapped ? (
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 rounded-lg bg-[#101e25]/85 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-white border border-white/10">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400" />
                  <span>{isScreenSharing ? 'Your Screen' : 'You'}</span>
                  {isMicMuted && <MicOff className="h-3 w-3 text-red-400 ml-1" />}
                </div>
              ) : (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-md bg-[#101e25]/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur border border-white/10 pointer-events-none">
                  <span>{isScreenSharing ? 'Your Screen' : 'You'}</span>
                  {isMicMuted && <MicOff className="h-2.5 w-2.5 text-red-400" />}
                </div>
              )}
            </div>

            {/* Floating In-Room Media Controls Bar */}
            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-[#243c47] bg-[#101e25]/95 p-1 sm:p-1.5 shadow-2xl backdrop-blur-xl">
              <button
                type="button"
                onClick={toggleMic}
                title={isMicMuted ? 'Unmute Mic (M)' : 'Mute Mic (M)'}
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition cursor-pointer ${
                  !isMicMuted
                    ? 'bg-[#1a2d36] text-white hover:bg-[#243c47]'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
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
                    ? 'bg-[#1a2d36] text-white hover:bg-[#243c47]'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {!isCameraOff ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleScreenShare}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                className={`hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition cursor-pointer ${
                  isScreenSharing
                    ? 'bg-[#E09800] text-white font-bold shadow-lg shadow-[#E09800]/30'
                    : 'bg-[#1a2d36] text-slate-300 hover:bg-[#243c47] hover:text-white'
                }`}
              >
                <ScreenShare className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
                title="Toggle Chat"
                className={`md:hidden flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${
                  isMobileChatOpen
                    ? 'bg-[#E09800] text-white font-bold'
                    : 'bg-[#1a2d36] text-slate-300'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
              </button>

              <div className="h-5 w-px bg-[#243c47]" />

              <button
                type="button"
                onClick={handleExit}
                title="End Call (Esc)"
                className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-red-600 px-3 sm:px-3.5 text-xs font-bold text-white hover:bg-red-500 transition shadow-md shadow-red-600/20 cursor-pointer"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">End</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Live Chat Sidebar (Desktop Side-by-Side, Mobile Slide-Up / Overlay Drawer) */}
        <div className={`${
          isMobileChatOpen
            ? 'flex fixed inset-x-0 bottom-0 top-14 z-50'
            : 'hidden md:flex'
        } w-full md:w-80 lg:w-96 flex-col border-l border-[#243c47] bg-[#101e25]/98 backdrop-blur-2xl transition-all duration-300 shadow-2xl`}>
          
          {/* Chat Header */}
          <div className="flex h-14 items-center justify-between border-b border-[#243c47] px-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#E09800]" />
              <span className="text-xs font-bold text-slate-200">Encrypted Chat</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleInsertIcebreaker}
                className="flex items-center gap-1 rounded-lg border border-[#E09800]/40 bg-[#E09800]/15 px-2.5 py-1 text-[11px] font-bold text-[#E09800] hover:bg-[#E09800]/25 transition cursor-pointer"
                title="Generate a random conversation topic"
              >
                <Sparkles className="h-3 w-3 fill-[#E09800]" />
                <span>Icebreaker</span>
              </button>

              {isMobileChatOpen && (
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a2d36] text-slate-400 hover:text-white transition cursor-pointer"
                  title="Close Chat"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Message Log */}
          <div className="relative flex-1 overflow-y-auto p-4 space-y-3">
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
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 p-4 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a2d36] text-slate-400 border border-[#243c47]">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium">Say hello! Messages are peer-to-peer and filtered for safety.</p>
              </div>
            ) : (
              messages.map((item, idx) => {
                const isYou = item.sender === room.socket.id
                return (
                  <div
                    key={`${item.createdAt}-${idx}`}
                    className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-500 mb-1 px-1">
                      {isYou ? 'You' : 'Stranger'}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm break-words ${
                        isYou
                          ? 'bg-[#E09800] text-white font-medium rounded-br-none'
                          : 'bg-[#1a2d36] text-slate-100 rounded-bl-none border border-[#243c47]'
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

          {/* Quick Emoji Reaction Bar (Flying Emojis) */}
          <div className="flex items-center justify-between border-t border-[#243c47] bg-[#122027] px-2 py-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 w-full justify-between">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-lg hover:scale-130 hover:bg-[#1a2d36] active:scale-95 transition-all duration-150 cursor-pointer"
                  title={`Send ${emoji} (Flies above!)`}
                >
                  <span className="leading-none select-none">{emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="border-t border-[#243c47] bg-[#15252e] p-2 backdrop-blur-xl">
              <div className="grid grid-cols-5 gap-1 max-h-36 overflow-y-auto p-1">
                {EXPANDED_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji)
                      triggerFlyEmoji(emoji, false)
                    }}
                    className="flex h-8 items-center justify-center rounded-lg text-lg hover:bg-[#1a2d36] hover:scale-120 active:scale-95 transition cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-[#243c47] p-3 flex gap-2 items-center bg-[#101e25]">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                showEmojiPicker
                  ? 'border-[#E09800] bg-[#E09800]/20 text-[#E09800]'
                  : 'border-[#243c47] bg-[#1a2d36] text-slate-400 hover:text-white'
              }`}
              title="Toggle Emoji Drawer"
            >
              <Smile className="h-4 w-4" />
            </button>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message here..."
              disabled={status !== 'connected'}
              className="flex-1 rounded-xl border border-[#243c47] bg-[#122027] px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#E09800] disabled:opacity-40 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || status !== 'connected'}
              style={{ backgroundColor: '#E09800', color: '#ffffff' }}
              className="btn-yellow-primary flex h-8 w-8 items-center justify-center rounded-xl bg-[#E09800] text-white hover:bg-[#C78600] transition disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </form>
        </div>
      </div>

      {/* Safety Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-400" />
              <span>Report Stranger</span>
            </h3>
            <p className="text-xs text-slate-400">
              Please select the reason for reporting this user. You will be automatically disconnected and matched with a new stranger.
            </p>

            {reportedSuccess ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 text-center font-semibold">
                Report submitted. Finding a new match…
              </div>
            ) : (
              <div className="space-y-2">
                {['Inappropriate Content / Behavior', 'Spam / Scam', 'Harassment or Hate Speech', 'Underage User'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleReport(reason)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left text-xs font-medium text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="w-full rounded-xl border border-slate-800 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
