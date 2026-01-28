import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import {
  Video,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Shield,
  Zap,
  Tag,
  ArrowRight,
  Plus,
  Minus,
  Lock,
  Compass,
  User,
  Users,
  Key,
  Share2,
  Sparkles,
} from 'lucide-react'

const POPULAR_TAGS = [
  'Gaming',
  'Music',
  'Coding',
  'Movies',
  'Travel',
  'Design',
  'Tech & AI',
  'Chill Chat',
  'Anime',
  'Fitness',
  'Crypto',
  'Late Night',
]

export default function HomePage({ user, onlineCount = 1, localStream, onInitializeMedia, onStartChat, onOpenAuth }) {
  const { isDark } = useTheme()
  const [chatMode, setChatMode] = useState('duo') // 'duo' | 'group'
  const [groupAction, setGroupAction] = useState('match') // 'match' | 'create' | 'join'
  const [joinRoomCodeInput, setJoinRoomCodeInput] = useState('')
  const [selectedTags, setSelectedTags] = useState(['Gaming', 'Music'])
  const [customTagInput, setCustomTagInput] = useState('')
  const [cameraActive, setCameraActive] = useState(true)
  const [micActive, setMicActive] = useState(true)
  const [mediaError, setMediaError] = useState('')
  const [previewAspectRatio, setPreviewAspectRatio] = useState(null)

  const previewVideoRef = useRef(null)

  // Check URL query parameters on mount (e.g. ?room=GRP-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomParam = params.get('room')
    if (roomParam) {
      setChatMode('group')
      setGroupAction('join')
      setJoinRoomCodeInput(roomParam.trim().toUpperCase())
    }
  }, [])

  // Initialize camera preview on home screen
  useEffect(() => {
    let active = true

    async function initPreview() {
      try {
        if (localStream) {
          if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = localStream
            previewVideoRef.current.play().catch(() => {})
          }
          setMediaError('')
          return
        }

        if (onInitializeMedia) {
          const stream = await onInitializeMedia()
          if (active && stream && previewVideoRef.current) {
            previewVideoRef.current.srcObject = stream
            previewVideoRef.current.play().catch(() => {})
          }
          setMediaError('')
        }
      } catch (err) {
        console.warn('Camera preview not available:', err.message)
        setMediaError('Camera / mic preview not accessible. You can still chat!')
      }
    }

    if (cameraActive) {
      initPreview()
    } else {
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null
      }
    }

    return () => {
      active = false
    }
  }, [cameraActive, localStream, onInitializeMedia])

  // Track preview stream aspect ratio to adapt container size dynamically
  useEffect(() => {
    const previewEl = previewVideoRef.current
    const updateRatio = () => {
      if (previewEl && previewEl.videoWidth && previewEl.videoHeight) {
        setPreviewAspectRatio(previewEl.videoWidth / previewEl.videoHeight)
      }
    }
    if (previewEl) {
      previewEl.addEventListener('loadedmetadata', updateRatio)
      previewEl.addEventListener('resize', updateRatio)
      updateRatio()
    }
    return () => {
      if (previewEl) {
        previewEl.removeEventListener('loadedmetadata', updateRatio)
        previewEl.removeEventListener('resize', updateRatio)
      }
    }
  }, [cameraActive, localStream])

  const toggleCameraPreview = () => {
    const stream = localStream || previewVideoRef.current?.srcObject
    if (stream) {
      const vTrack = stream.getVideoTracks()[0]
      if (vTrack) {
        vTrack.enabled = !cameraActive
      }
    }
    setCameraActive(!cameraActive)
  }

  const toggleMicPreview = () => {
    const stream = localStream || previewVideoRef.current?.srcObject
    if (stream) {
      const aTrack = stream.getAudioTracks()[0]
      if (aTrack) {
        aTrack.enabled = !micActive
      }
    }
    setMicActive(!micActive)
  }


  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      if (selectedTags.length < 8) {
        setSelectedTags([...selectedTags, tag])
      }
    }
  }

  const handleAddCustomTag = (e) => {
    e.preventDefault()
    const trimmed = customTagInput.trim().replace(/^#+/, '')
    if (trimmed && !selectedTags.includes(trimmed)) {
      if (selectedTags.length < 8) {
        setSelectedTags([...selectedTags, trimmed])
        setCustomTagInput('')
      }
    }
  }

  const handleLaunch = () => {
    onStartChat({
      mode: chatMode,
      groupAction,
      groupRoomCode: joinRoomCodeInput.trim().toUpperCase(),
      interests: selectedTags,
      cameraActive,
      micActive,
    })
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#142229] text-slate-800 dark:text-slate-100 overflow-hidden">
      {/* Background Subtle Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30 animate-grid-drift" />

      {/* Seamless Warm Ambient Lamp Illumination Spanning Navbar & Page Background */}
      {isDark && (
        <div 
          className="pointer-events-none absolute -top-24 right-0 sm:right-[max(0.5rem,calc((100vw-80rem)/2+4rem))] lg:right-[max(1.5rem,calc((100vw-80rem)/2+6rem))] w-[700px] sm:w-[950px] lg:w-[1100px] h-[700px] sm:h-[950px] lg:h-[1100px] rounded-full z-0 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.09) 38%, rgba(180, 83, 9, 0.02) 62%, transparent 80%)',
            filter: 'blur(50px)',
          }}
        />
      )}

      <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-16">
        {/* Hero Section */}
        <section className="pt-0 sm:pt-1 pb-6 space-y-3 sm:space-y-4">
          {/* Top Editorial Headline Block */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-500 dark:text-slate-400">
                  P2P Encrypted • High Definition WebRTC
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 dark:text-white uppercase leading-none">
                Meet Strangers<span className="text-[#964f26]">.</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 pb-0.5 self-start sm:self-auto">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#243c47] bg-white/80 dark:bg-[#1a2d36]/80 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono font-bold text-slate-900 dark:text-white">{Number(onlineCount).toLocaleString()}</span>
                <span className="text-slate-500 dark:text-slate-400">{onlineCount === 1 ? 'stranger online' : 'strangers online'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Windows Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            {/* Frame: Interests & Matching Topics */}
            <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col">
              <div className="rounded-2xl border border-slate-200 dark:border-[#243c47] bg-white/95 dark:bg-[#1a2d36]/90 shadow-xl dark:shadow-2xl backdrop-blur-2xl overflow-hidden flex-1 flex flex-col">
                {/* Top Bar with Mode Switcher */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#243c47] bg-slate-100/90 dark:bg-[#15252e] px-3 sm:px-3.5 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Mode Selection</span>
                  <div className="flex items-center gap-1 rounded-lg bg-slate-200/80 dark:bg-[#101b22] p-0.5 border border-slate-300 dark:border-[#243c47]">
                    <button
                      type="button"
                      onClick={() => setChatMode('duo')}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                        chatMode === 'duo'
                          ? 'btn-lamp-primary text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <User className="h-3 w-3" />
                      <span>1-on-1 Duo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatMode('group')}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                        chatMode === 'group'
                          ? 'btn-lamp-primary text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Users className="h-3 w-3" />
                      <span>Group Lounge (3-6)</span>
                    </button>
                  </div>
                </div>

                {/* Console Content */}
                <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  {chatMode === 'duo' ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-slate-400" />
                          <span>Match by Interests (Optional)</span>
                        </label>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {selectedTags.length}/8 active
                        </span>
                      </div>

                      {/* Dynamic Tags Wrap */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {[
                          ...selectedTags,
                          ...POPULAR_TAGS.filter((tag) => !selectedTags.includes(tag)),
                        ].map((tag) => {
                          const isSelected = selectedTags.includes(tag)
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleTag(tag)}
                              className={`group rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 select-none ${
                                isSelected
                                  ? 'btn-lamp-tag text-white scale-102'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 dark:bg-[#122027] dark:text-slate-300 dark:hover:bg-[#1a2d36] dark:hover:text-white dark:border-[#243c47]'
                              }`}
                            >
                              {isSelected ? (
                                <Minus className="h-3 w-3 shrink-0 text-white transition-transform duration-150" />
                              ) : (
                                <Plus className="h-3 w-3 shrink-0 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform duration-150" />
                              )}
                              <span>{tag}</span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Custom Topic Input */}
                      <form onSubmit={handleAddCustomTag} className="flex gap-2">
                        <input
                          value={customTagInput}
                          onChange={(e) => setCustomTagInput(e.target.value)}
                          placeholder="Add custom topic (e.g. Formula1, Art, Tech)..."
                          className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#101e25] px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#964f26] focus:ring-1 focus:ring-[#964f26] transition"
                        />
                        <button
                          type="submit"
                          className="flex items-center gap-1 shrink-0 rounded-lg border border-slate-200 dark:border-[#243c47] bg-slate-100 hover:bg-slate-200 dark:bg-[#122027] dark:hover:bg-[#1a2d36] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                        >
                          <Plus className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                          <span>Add</span>
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Group Lounge Options</span>
                      </label>

                      {/* Group Action Selector */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setGroupAction('match')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center cursor-pointer ${
                            groupAction === 'match'
                              ? 'border-[#964f26] bg-[#964f26]/10 text-slate-900 dark:text-white font-bold'
                              : 'border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#122027] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d36]'
                          }`}
                        >
                          <Sparkles className="h-4 w-4 mb-1 text-slate-500 dark:text-slate-400" />
                          <span className="text-xs font-bold">Quick Match</span>
                          <span className="text-[10px] text-slate-400">Random Strangers</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGroupAction('create')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center cursor-pointer ${
                            groupAction === 'create'
                              ? 'border-[#964f26] bg-[#964f26]/10 text-slate-900 dark:text-white font-bold'
                              : 'border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#122027] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d36]'
                          }`}
                        >
                          <Share2 className="h-4 w-4 mb-1 text-slate-500 dark:text-slate-400" />
                          <span className="text-xs font-bold">Create Group</span>
                          <span className="text-[10px] text-slate-400">Invite Friends</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGroupAction('join')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center cursor-pointer ${
                            groupAction === 'join'
                              ? 'border-[#964f26] bg-[#964f26]/10 text-slate-900 dark:text-white font-bold'
                              : 'border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#122027] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d36]'
                          }`}
                        >
                          <Key className="h-4 w-4 mb-1 text-slate-500 dark:text-slate-400" />
                          <span className="text-xs font-bold">Join by Code</span>
                          <span className="text-[10px] text-slate-400">Enter Room ID</span>
                        </button>
                      </div>

                      {/* Join by Code Input (when selected) */}
                      {groupAction === 'join' && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            Enter Group Room Code or Invite Link:
                          </label>
                          <input
                            value={joinRoomCodeInput}
                            onChange={(e) => setJoinRoomCodeInput(e.target.value)}
                            placeholder="e.g. GRP-4829"
                            className="w-full rounded-xl border border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#101e25] px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#964f26] transition"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Smart Match Info Box */}
                  <div className="rounded-xl border border-slate-200 dark:border-[#243c47] bg-slate-100/80 dark:bg-[#122027]/80 p-3">
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {chatMode === 'duo' ? (
                        <>
                          <span className="font-semibold text-slate-900 dark:text-white">Smart Match Queue:</span> Choose topics to match with people of shared interests, or leave empty to match randomly.
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-900 dark:text-white">Group Lounge:</span> Talk with 3 to 6 strangers simultaneously, or invite specific friends using a shareable room code.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Frame: Live Camera Preview & Start Button */}
            <div className="order-1 lg:order-2 lg:col-span-5 flex flex-col">
              <div className="rounded-2xl border border-slate-200 dark:border-[#243c47] bg-white/95 dark:bg-[#1a2d36]/90 shadow-xl dark:shadow-2xl backdrop-blur-2xl overflow-hidden flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#243c47] bg-slate-100/90 dark:bg-[#15252e] px-3.5 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Live Camera</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>READY</span>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div
                    style={{
                      aspectRatio: previewAspectRatio ? `${previewAspectRatio}` : undefined,
                    }}
                    className={`relative ${
                      !previewAspectRatio ? 'aspect-[3/4] sm:aspect-video lg:aspect-[16/10]' : ''
                    } max-h-[460px] w-full overflow-hidden rounded-xl bg-slate-900 dark:bg-[#0e191f] border border-slate-300 dark:border-[#243c47] shadow-lg flex items-center justify-center group mx-auto`}
                  >
                    {cameraActive ? (
                      <video
                        ref={previewVideoRef}
                        autoPlay
                        muted
                        playsInline
                        onLoadedMetadata={(e) => {
                          if (e.target.videoWidth && e.target.videoHeight) {
                            setPreviewAspectRatio(e.target.videoWidth / e.target.videoHeight)
                          }
                        }}
                        style={{ objectFit: 'contain' }}
                        className="h-full w-full object-contain -scale-x-100"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 dark:bg-[#15252e] text-slate-300 border border-slate-700 dark:border-[#243c47]">
                          <CameraOff className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">Camera is disabled</span>
                      </div>
                    )}

                    {/* Overlaid Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-slate-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white border border-white/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Self Preview</span>
                    </div>

                    {/* Overlaid Floating Toggle Controls */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-xl p-1.5 border border-white/15 shadow-xl">
                      <button
                        type="button"
                        onClick={toggleMicPreview}
                        title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                          micActive
                            ? 'bg-slate-800 text-white hover:bg-slate-700'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {micActive ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleCameraPreview}
                        title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                          cameraActive
                            ? 'bg-slate-800 text-white hover:bg-slate-700'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {cameraActive ? <Camera className="h-3.5 w-3.5" /> : <CameraOff className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Action Button */}
                  <button
                    type="button"
                    onClick={handleLaunch}
                    className="btn-lamp-primary group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-all duration-150 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 fill-white text-white group-hover:scale-110 transition-transform" />
                    <span className="tracking-wide text-white font-bold">
                      {chatMode === 'duo'
                        ? 'Start 1-on-1 Video Chat'
                        : groupAction === 'create'
                        ? 'Create & Enter Group Lounge'
                        : groupAction === 'join' && joinRoomCodeInput.trim()
                        ? `Join Group (${joinRoomCodeInput.trim().toUpperCase()})`
                        : groupAction === 'join'
                        ? 'Enter Group Code to Join'
                        : 'Join Stranger Group Lounge'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-white" />
                  </button>

                  {/* Security & Info Line */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        <Shield className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                        Direct WebRTC Encryption
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">30-60 FPS</span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Streams connect directly peer-to-peer and are never recorded or stored.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Strangers Online Counter */}
        <div className="mb-14 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-[#243c47] bg-white/80 dark:bg-[#1a2d36]/80 px-6 py-3 backdrop-blur-xl shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              {Number(onlineCount).toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              {onlineCount === 1 ? 'Stranger Online' : 'Strangers Online'}
            </span>
          </div>
        </div>

        {/* Bento Grid Feature Showcase */}
        <section className="mb-14 space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-[#15252e] border border-slate-200 dark:border-[#243c47] px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Zap className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span className="uppercase tracking-wider">Editorial Architecture</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
              Instant, Safe Connections<span className="text-[#964f26]">.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Random stranger video chat redesigned with high-throughput Redis matchmaking and direct browser streaming.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="rounded-3xl border border-slate-200 dark:border-[#243c47] bg-white/85 dark:bg-[#1a2d36]/80 p-6 glass-card-hover space-y-3 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#122027] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243c47]">
                <Zap className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Instant Matching</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Powered by distributed Redis queues for rapid sub-second pairings without waiting in queues.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-[#243c47] bg-white/85 dark:bg-[#1a2d36]/80 p-6 glass-card-hover space-y-3 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#122027] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243c47]">
                <Lock className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Direct WebRTC</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Direct browser-to-browser media streaming ensures zero lag, high definition, and complete privacy.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-[#243c47] bg-white/85 dark:bg-[#1a2d36]/80 p-6 glass-card-hover space-y-3 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#122027] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243c47]">
                <Compass className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Topic Filters</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Select topics to match with people who love the exact same games, music, shows, or coding stacks.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-[#243c47] bg-white/85 dark:bg-[#1a2d36]/80 p-6 glass-card-hover space-y-3 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#122027] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243c47]">
                <Shield className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Instant Skip & Safety</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Easily disconnect with one click (or Spacebar) and report inappropriate behavior instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Safety & Guidelines Section */}
        <section className="rounded-3xl border border-slate-200 dark:border-[#243c47] bg-white/85 dark:bg-[#1a2d36]/80 p-6 sm:p-8 space-y-6 shadow-md dark:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#243c47] pb-5">
            <div>
              <h3 className="font-display text-xl font-black text-slate-950 dark:text-white uppercase">
                Community Safety & Guidelines<span className="text-[#964f26]">.</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Keep MeetUp friendly, welcoming, and safe for everyone.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#122027] border border-slate-200 dark:border-[#243c47] px-3.5 py-1.5 rounded-full self-start">
              <Shield className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>Moderated Platform</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-[#122027] border border-slate-200 dark:border-[#243c47]">
              <div className="font-bold text-slate-900 dark:text-white text-sm">1. Be Respectful</div>
              <p className="leading-relaxed">Harassment, hate speech, vulgarity, and toxic behavior are strictly prohibited.</p>
            </div>
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-[#122027] border border-slate-200 dark:border-[#243c47]">
              <div className="font-bold text-slate-900 dark:text-white text-sm">2. Protect Privacy</div>
              <p className="leading-relaxed">Never share passwords, credit card info, phone numbers, or private addresses.</p>
            </div>
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-[#122027] border border-slate-200 dark:border-[#243c47]">
              <div className="font-bold text-slate-900 dark:text-white text-sm">3. Appropriate Conduct</div>
              <p className="leading-relaxed">MeetUp is a safe platform. Keep all video and text conversations friendly.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#243c47] bg-slate-100/90 dark:bg-[#101e25] py-8 text-center text-xs text-slate-600 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-slate-900 dark:text-white text-sm uppercase tracking-wide">
              MeetUp<span className="text-[#964f26]">.</span>
            </span>
            <span className="text-slate-500">— An editorial encrypted video chat experience</span>
          </div>
          <div className="text-slate-500">
            © {new Date().getFullYear()} MeetUp Inc. Peer-to-Peer Encrypted • Zero Telemetry.
          </div>
        </div>
      </footer>
    </div>
  )
}
