import { useState, useEffect, useRef } from 'react'
import {
  Video,
  MessageSquare,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Shield,
  Zap,
  Globe,
  Users,
  Lock,
  ArrowRight,
  Plus,
  Check,
  CheckCircle2,
  Compass,
  Tag,
  Radio,
  Sliders,
  Flame,
  Volume2
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

export default function HomePage({ user, onlineCount = 1, onStartChat, onOpenAuth }) {
  const [mode, setMode] = useState('video') // 'video' | 'text'
  const [selectedTags, setSelectedTags] = useState(['Gaming', 'Music'])
  const [customTagInput, setCustomTagInput] = useState('')
  const [cameraActive, setCameraActive] = useState(true)
  const [micActive, setMicActive] = useState(true)
  const [mediaError, setMediaError] = useState('')

  const previewVideoRef = useRef(null)
  const previewStreamRef = useRef(null)

  // Initialize camera preview on home screen
  useEffect(() => {
    let active = true

    async function initPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, facingMode: 'user' },
          audio: true,
        })
        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        previewStreamRef.current = stream
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream
        }
        setMediaError('')
      } catch (err) {
        console.warn('Camera preview not available:', err.message)
        setMediaError('Camera / mic preview not accessible. You can still chat!')
      }
    }

    if (cameraActive) {
      initPreview()
    } else {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((track) => track.stop())
        previewStreamRef.current = null
      }
    }

    return () => {
      active = false
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraActive])

  const toggleCameraPreview = () => {
    if (previewStreamRef.current) {
      const vTrack = previewStreamRef.current.getVideoTracks()[0]
      if (vTrack) {
        vTrack.enabled = !cameraActive
      }
    }
    setCameraActive(!cameraActive)
  }

  const toggleMicPreview = () => {
    if (previewStreamRef.current) {
      const aTrack = previewStreamRef.current.getAudioTracks()[0]
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
      mode,
      interests: selectedTags,
      cameraActive,
      micActive,
    })
  }

  return (
    <div className="relative min-h-screen bg-[#142229] text-slate-100 overflow-hidden">
      {/* Background Animated Decorative Mesh & Radial Atmospheric Glowing Orbs */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 animate-grid-drift" />
      
      {/* Dynamic Animated Floating Glow Orbs (Aurora Effect - High Visibility) */}
      <div className="pointer-events-none absolute -top-32 right-[5%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#E09800]/45 via-[#d97706]/25 to-transparent blur-[85px] animate-orb-1" />
      <div className="pointer-events-none absolute top-[15%] -left-32 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-[#0284c7]/45 via-[#0369a1]/30 to-transparent blur-[80px] animate-orb-2" />
      <div className="pointer-events-none absolute top-[35%] left-[25%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#E09800]/30 via-[#10b981]/25 to-transparent blur-[75px] animate-orb-3" />
      <div className="pointer-events-none absolute bottom-[10%] right-[15%] h-[450px] w-[450px] rounded-full bg-gradient-to-tl from-[#0284c7]/35 via-[#E09800]/25 to-transparent blur-[80px] animate-orb-1" />

      {/* Floating Vibrant Luminous Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute top-[18%] left-[12%] h-2.5 w-2.5 rounded-full bg-[#E09800] shadow-[0_0_14px_4px_rgba(224,152,0,0.9)] animate-particle-1" />
        <span className="absolute top-[28%] right-[22%] h-3 w-3 rounded-full bg-[#38bdf8] shadow-[0_0_16px_4px_rgba(56,189,248,0.9)] animate-particle-2" />
        <span className="absolute top-[48%] left-[38%] h-2 w-2 rounded-full bg-[#E09800] shadow-[0_0_12px_3px_rgba(224,152,0,0.85)] animate-particle-3" />
        <span className="absolute top-[14%] right-[38%] h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_4px_rgba(52,211,153,0.9)] animate-particle-4" />
        <span className="absolute top-[65%] left-[18%] h-3 w-3 rounded-full bg-[#E09800] shadow-[0_0_16px_4px_rgba(224,152,0,0.9)] animate-particle-5" />
        <span className="absolute top-[58%] right-[10%] h-2.5 w-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_14px_4px_rgba(56,189,248,0.9)] animate-particle-6" />
        <span className="absolute top-[75%] left-[45%] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_3px_rgba(52,211,153,0.85)] animate-particle-7" />
        <span className="absolute top-[35%] left-[8%] h-2.5 w-2.5 rounded-full bg-[#E09800] shadow-[0_0_14px_4px_rgba(224,152,0,0.85)] animate-particle-8" />
      </div>

      <main className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-16">
        
        {/* Hero Section: Leo Cerso Editorial Architecture */}
        <section className="pt-0 sm:pt-1 pb-6 space-y-3 sm:space-y-4">
          
          {/* Top Editorial Headline Block (Leo Cerso Template) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-400">
                  P2P Encrypted • High Definition WebRTC
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#E09800]" />
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase leading-none">
                Meet Strangers<span className="text-[#E09800]">.</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 pb-0.5 self-start sm:self-auto">
              <div className="flex items-center gap-2 rounded-full border border-[#243c47] bg-[#1a2d36]/80 px-3 py-1 text-xs text-slate-300 shadow-inner">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono font-bold text-emerald-400">{Number(onlineCount).toLocaleString()}</span>
                <span className="text-slate-400">{onlineCount === 1 ? 'stranger online' : 'strangers online'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Windows Grid (Mockup Browser Frames Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            
            {/* Frame: Interests & Matching Topics (Below Video on Mobile, Left on Desktop) */}
            <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col">
              {/* Browser Window Mockup Frame */}
              <div className="rounded-2xl border border-[#243c47] bg-[#1a2d36]/90 shadow-2xl backdrop-blur-2xl overflow-hidden flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="flex items-center justify-between border-b border-[#243c47] bg-[#15252e] px-3 sm:px-3.5 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Match Settings</span>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedTags.length}/8 active</span>
                </div>

                {/* Console Content */}
                <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  {/* Interests & Topic Matching */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                        <span>Match by Interests (Optional)</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedTags.length}/8 active
                      </span>
                    </div>

                    {/* Popular Tags Wrap */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {POPULAR_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            style={isSelected ? { backgroundColor: '#E09800', color: '#ffffff', borderColor: '#FFB82E' } : {}}
                            className={`group rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 select-none ${
                              isSelected
                                ? 'bg-[#E09800] text-white shadow-sm shadow-[#E09800]/30 border border-[#FFB82E] scale-102'
                                : 'bg-[#122027] text-slate-300 hover:bg-[#1a2d36] hover:text-white border border-[#243c47]'
                            }`}
                          >
                            <Plus
                              className={`h-3 w-3 shrink-0 transition-transform duration-150 ${
                                isSelected ? 'text-white' : 'text-[#E09800] group-hover:text-white group-hover:scale-110'
                              }`}
                            />
                            <span>{tag}</span>
                          </button>
                        )
                      })}

                      {/* User Custom Added Tags (if any outside POPULAR_TAGS) */}
                      {selectedTags
                        .filter((tag) => !POPULAR_TAGS.includes(tag))
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            style={{ backgroundColor: '#E09800', color: '#ffffff', borderColor: '#FFB82E' }}
                            className="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 bg-[#E09800] text-white shadow-sm shadow-[#E09800]/30 border border-[#FFB82E] scale-102 select-none"
                          >
                            <Plus className="h-3 w-3 shrink-0 text-white" />
                            <span>{tag}</span>
                            <span className="ml-1 text-white/70 hover:text-white font-mono text-xs">×</span>
                          </button>
                        ))}
                    </div>

                    {/* Custom Topic Input */}
                    <form onSubmit={handleAddCustomTag} className="flex gap-2">
                      <input
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="Add custom topic (e.g. Formula1, Art, Tech)..."
                        className="flex-1 min-w-0 rounded-lg border border-[#243c47] bg-[#101e25] px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#E09800] focus:ring-1 focus:ring-[#E09800] transition"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1 shrink-0 rounded-lg border border-[#243c47] bg-[#122027] hover:bg-[#1a2d36] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <Plus className="h-3 w-3 text-slate-400" />
                        <span>Add</span>
                      </button>
                    </form>
                  </div>

                  {/* Smart Match Info Box */}
                  <div className="rounded-xl border border-[#243c47] bg-[#122027]/80 p-3 flex items-start gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mt-1 shrink-0" />
                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-semibold text-white">Smart Match Queue:</span> Choose topics to match with people of shared interests, or leave empty to match randomly.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Frame: Live Camera Preview & Start Button (Above Interests on Mobile, Right on Desktop) */}
            <div className="order-1 lg:order-2 lg:col-span-5 flex flex-col">
              {/* Browser Window Mockup Frame */}
              <div className="rounded-2xl border border-[#243c47] bg-[#1a2d36]/90 shadow-2xl backdrop-blur-2xl overflow-hidden flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="flex items-center justify-between border-b border-[#243c47] bg-[#15252e] px-3.5 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live Camera</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>READY</span>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {/* 16:9 Widescreen Video Window matching camera stream */}
                  <div className="relative aspect-video max-h-[460px] w-full overflow-hidden rounded-xl bg-[#0e191f] border border-[#243c47] shadow-lg flex items-center justify-center group">
                    {cameraActive ? (
                      <video
                        ref={previewVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-cover -scale-x-100"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15252e] text-slate-400 border border-[#243c47]">
                          <CameraOff className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">Camera is disabled</span>
                      </div>
                    )}

                    {/* Overlaid Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-[#0e191f]/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white border border-white/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Self Preview</span>
                    </div>

                    {/* Overlaid Floating Toggle Controls */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-[#101e25]/90 backdrop-blur-xl p-1.5 border border-white/15 shadow-xl">
                      <button
                        type="button"
                        onClick={toggleMicPreview}
                        title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                          micActive
                            ? 'bg-[#1a2d36] text-white hover:bg-[#243c47]'
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
                            ? 'bg-[#1a2d36] text-white hover:bg-[#243c47]'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {cameraActive ? <Camera className="h-3.5 w-3.5" /> : <CameraOff className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Compact Start Video Chat Button */}
                  <button
                    type="button"
                    onClick={handleLaunch}
                    style={{ backgroundColor: '#E09800', color: '#ffffff', border: '1px solid #FFB82E' }}
                    className="btn-yellow-primary group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#E09800] hover:bg-[#C78600] py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#E09800]/40 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 fill-white text-white group-hover:scale-110 transition-transform" />
                    <span className="tracking-wide text-white font-bold">Start Video Chat</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-white" />
                  </button>

                  {/* Security & Info Line */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-300">
                        <Shield className="h-3 w-3 text-slate-400" />
                        Direct WebRTC Encryption
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">30-60 FPS</span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">
                      Streams connect directly peer-to-peer and are never recorded or stored.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Network Metrics Strip */}
        <section className="mb-14 rounded-3xl border border-[#243c47] bg-[#1a2d36]/70 p-6 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-[#243c47]">
            <div className="space-y-1">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{Number(onlineCount).toLocaleString()}</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">{onlineCount === 1 ? 'Online Stranger' : 'Online Strangers'}</div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#E09800]">&lt; 0.8s</div>
              <div className="text-xs text-slate-400 font-medium">Average Match Time</div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">160+</div>
              <div className="text-xs text-slate-400 font-medium">Countries Worldwide</div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 font-medium">Encrypted WebRTC P2P</div>
            </div>
          </div>
        </section>

        {/* Bento Grid Feature Showcase */}
        <section className="mb-14 space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#15252e] border border-[#243c47] px-3 py-1 text-xs font-semibold text-slate-300">
              <Zap className="h-3.5 w-3.5 text-slate-400" />
              <span className="uppercase tracking-wider">Editorial Architecture</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Instant, Safe Connections<span className="text-[#E09800]">.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Random stranger video chat redesigned with high-throughput Redis matchmaking and direct browser streaming.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="rounded-3xl border border-[#243c47] bg-[#1a2d36]/80 p-6 glass-card-hover space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#122027] text-slate-200 border border-[#243c47]">
                <Zap className="h-5 w-5 text-slate-200" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Instant Matching</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Powered by distributed Redis queues for rapid sub-second pairings without waiting in queues.
              </p>
            </div>

            <div className="rounded-3xl border border-[#243c47] bg-[#1a2d36]/80 p-6 glass-card-hover space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#122027] text-slate-200 border border-[#243c47]">
                <Lock className="h-5 w-5 text-slate-200" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Direct WebRTC</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct browser-to-browser media streaming ensures zero lag, high definition, and complete privacy.
              </p>
            </div>

            <div className="rounded-3xl border border-[#243c47] bg-[#1a2d36]/80 p-6 glass-card-hover space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#122027] text-slate-200 border border-[#243c47]">
                <Compass className="h-5 w-5 text-slate-200" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Topic Filters</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select topics to match with people who love the exact same games, music, shows, or coding stacks.
              </p>
            </div>

            <div className="rounded-3xl border border-[#243c47] bg-[#1a2d36]/80 p-6 glass-card-hover space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#122027] text-slate-200 border border-[#243c47]">
                <Shield className="h-5 w-5 text-slate-200" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Instant Skip & Safety</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Easily disconnect with one click (or Spacebar) and report inappropriate behavior instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Safety & Guidelines Section */}
        <section className="rounded-3xl border border-[#243c47] bg-[#1a2d36]/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243c47] pb-5">
            <div>
              <h3 className="font-display text-xl font-black text-white uppercase">
                Community Safety & Guidelines<span className="text-[#E09800]">.</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Keep MeetUp friendly, welcoming, and safe for everyone.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-[#122027] border border-[#243c47] px-3.5 py-1.5 rounded-full self-start">
              <Shield className="h-4 w-4 text-slate-400" />
              <span>Moderated Platform</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
            <div className="space-y-1.5 p-4 rounded-2xl bg-[#122027] border border-[#243c47]">
              <div className="font-bold text-white text-sm">1. Be Respectful</div>
              <p className="leading-relaxed">Harassment, hate speech, vulgarity, and toxic behavior are strictly prohibited.</p>
            </div>
            <div className="space-y-1.5 p-4 rounded-2xl bg-[#122027] border border-[#243c47]">
              <div className="font-bold text-white text-sm">2. Protect Privacy</div>
              <p className="leading-relaxed">Never share passwords, credit card info, phone numbers, or private addresses.</p>
            </div>
            <div className="space-y-1.5 p-4 rounded-2xl bg-[#122027] border border-[#243c47]">
              <div className="font-bold text-white text-sm">3. Appropriate Conduct</div>
              <p className="leading-relaxed">MeetUp is a safe platform. Keep all video and text conversations friendly.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Leo Cerso Theme */}
      <footer className="border-t border-[#243c47] bg-[#101e25] py-8 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-white text-sm uppercase tracking-wide">
              MeetUp<span className="text-[#E09800]">.</span>
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

