import { useState, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function PendantThemeToggle({ className = '', variant = 'compact' }) {
  const { isDark, toggleTheme } = useTheme()
  const [isPulling, setIsPulling] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const audioCtxRef = useRef(null)

  // Play a soft tactile click sound using Web Audio API
  const playClickSound = (turningOn) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      if (turningOn) {
        // Soft warm switch on chime
        osc.frequency.setValueAtTime(320, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      } else {
        // Soft snap switch off click
        osc.frequency.setValueAtTime(480, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.06)
        gain.gain.setValueAtTime(0.07, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
      }

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.14)
    } catch {
      // Ignore audio failure
    }
  }

  const handleToggle = () => {
    toggleTheme()
    setIsPulling(true)
    playClickSound(!isDark)
    setTimeout(() => {
      setIsPulling(false)
    }, 200)
  }

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Hanging Murano Glass Orb Pendant Button */}
      <button
        type="button"
        onClick={handleToggle}
        title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        aria-label={isDark ? 'Turn off lamp (Light Theme)' : 'Turn on lamp (Dark Theme)'}
        className={`group relative flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-full cursor-pointer transition-transform duration-200 ${
          isPulling ? 'translate-y-2.5' : 'translate-y-0'
        }`}
      >
        {/* Hanging Fixture Assembly with Gentle Left-Right Sway on Hover */}
        <div
          className={`relative flex flex-col items-center origin-top ${
            isHovered && !isPulling ? 'animate-pendant-sway' : ''
          }`}
        >
          {/* Ceiling Mount / Top Joint */}
          <div className="h-1.5 w-3 rounded-t-sm bg-stone-700 dark:bg-stone-500 shadow-xs" />
          
          {/* Vertical Cord that stretches and retracts on click */}
          <div
            className={`w-[1.75px] transition-all duration-200 bg-gradient-to-b ${
              isDark
                ? 'h-4 sm:h-5 from-stone-600 via-stone-700 to-amber-900/80 shadow-[0_0_4px_rgba(224,152,0,0.4)]'
                : 'h-4 sm:h-5 from-stone-400 via-stone-500 to-stone-600'
            } ${isPulling ? 'h-6.5 sm:h-7.5' : ''}`}
          />

          {/* Brass / Bronze Fixture Socket Cap */}
          <div className="relative -mt-0.5 flex flex-col items-center">
            {/* Top socket ring */}
            <div className="h-1 w-2 rounded-xs bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-800 shadow-xs" />
            {/* Main brass collar */}
            <div className="h-2 w-3.5 rounded-t-xs bg-gradient-to-r from-amber-800 via-yellow-600 to-amber-900 border-b border-amber-950/40 shadow-xs" />
          </div>

          {/* Murano Glass Orb Pendant Sphere Container */}
          <div className="relative flex items-center justify-center rounded-full">
            {/* Self-Contained Ambient Warm Glow on the Lamp Sphere */}
            {isDark && (
              <>
                {/* Soft outer glow around the sphere */}
                <div className="absolute -inset-2.5 sm:-inset-3 rounded-full bg-radial from-amber-500/40 via-orange-500/20 to-transparent blur-md pointer-events-none" />
                {/* Inner golden glow */}
                <div className="absolute -inset-1.5 rounded-full bg-radial from-amber-400/60 via-orange-500/30 to-transparent blur-xs pointer-events-none" />
              </>
            )}

            {/* SVG Murano Glass Orb Sphere */}
            <svg
              viewBox="0 0 100 100"
              className={`relative h-8 w-8 sm:h-9 sm:w-9 ${
                isDark
                  ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.85)] drop-shadow-[0_0_20px_rgba(234,88,12,0.45)]'
                  : 'drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
              }`}
            >
            <defs>
              {/* Radial gradient for Lit Murano Glass Orb (Dark Mode - Dim Warm) */}
              <radialGradient id="muranoLitGlow" cx="45%" cy="40%" r="55%" fx="40%" fy="35%">
                <stop offset="0%" stopColor="#FFF7ED" stopOpacity="0.95" />
                <stop offset="25%" stopColor="#FEF08A" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.85" />
                <stop offset="85%" stopColor="#D97706" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#92400E" stopOpacity="0.95" />
              </radialGradient>

              {/* Radial gradient for Unlit / Frosted Glass Orb (Light Mode) */}
              <radialGradient id="muranoUnlitGlass" cx="38%" cy="32%" r="62%" fx="35%" fy="30%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#E9D5FF" stopOpacity="0.8" />
                <stop offset="65%" stopColor="#C4B5FD" stopOpacity="0.75" />
                <stop offset="88%" stopColor="#8B5CF6" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.85" />
              </radialGradient>

              {/* Specular Glint Highlight */}
              <linearGradient id="specularGlint" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* Inner Filament Core Glow */}
              <radialGradient id="innerFilamentGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#FEF08A" stopOpacity="0.7" />
                <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>

              {/* Clip path for the sphere */}
              <clipPath id="orbClip">
                <circle cx="50" cy="50" r="46" />
              </clipPath>
            </defs>

            {/* Base Glass Sphere */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill={isDark ? 'url(#muranoLitGlow)' : 'url(#muranoUnlitGlass)'}
            />

            {/* Murano Crackled / Textured Internal Glass Veins */}
            <g clipPath="url(#orbClip)" opacity={isDark ? '0.85' : '0.55'}>
              {/* Organic crackle network pattern 1 */}
              <path
                d="M 25,20 Q 35,35 48,32 T 70,25 Q 82,45 68,60 T 52,78 Q 30,85 28,65 T 32,40 Z"
                fill="none"
                stroke={isDark ? '#FEF08A' : '#EDE9FE'}
                strokeWidth="1.2"
                strokeDasharray="2 1.5"
                opacity="0.8"
              />
              {/* Organic crackle network pattern 2 */}
              <path
                d="M 40,15 Q 55,28 62,45 T 78,68 Q 60,82 45,70 T 22,50 Q 30,30 45,22 Z"
                fill="none"
                stroke={isDark ? '#FDE047' : '#DDD6FE'}
                strokeWidth="1"
                strokeDasharray="3 1"
                opacity="0.75"
              />
              {/* Fine crystalline micro-fractures */}
              <path
                d="M 50,22 L 54,34 L 46,42 L 58,54 L 44,66 L 56,76 M 32,38 L 46,42 L 38,58 L 52,62 M 65,35 L 54,48 L 68,58"
                fill="none"
                stroke={isDark ? '#FFFFFF' : '#FFFFFF'}
                strokeWidth="0.8"
                opacity={isDark ? '0.9' : '0.6'}
              />
              {/* Swirling Murano internal bubbles/specks */}
              <circle cx="36" cy="38" r="2.5" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.8" />
              <circle cx="62" cy="42" r="1.8" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.75" />
              <circle cx="48" cy="58" r="2.2" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.85" />
              <circle cx="34" cy="62" r="1.4" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.6" />
              <circle cx="68" cy="65" r="2" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.7" />
              <circle cx="45" cy="28" r="1.5" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.7" />
              <circle cx="58" cy="30" r="1.2" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.65" />
              <circle cx="28" cy="48" r="1.6" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.6" />
              <circle cx="70" cy="50" r="1.5" fill={isDark ? '#FFFBEB' : '#FFFFFF'} opacity="0.7" />
            </g>

            {/* Inner Glowing Filament Core (Active in Dark Mode - Static, No Pulse) */}
            {isDark && (
              <circle
                cx="50"
                cy="48"
                r="18"
                fill="url(#innerFilamentGlow)"
              />
            )}

            {/* Top Curvature Glass Specular Highlight (Handblown glass sheen) */}
            <ellipse
              cx="38"
              cy="30"
              rx="16"
              ry="8"
              transform="rotate(-25 38 30)"
              fill="url(#specularGlint)"
            />

            {/* Edge refraction rim */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isDark ? '#F59E0B' : '#C4B5FD'}
              strokeWidth="1"
              opacity="0.4"
            />
          </svg>
        </div>

          {/* Pull Indicator Cord Tail (Subtle pull bead at the bottom of the orb) */}
          <div className="flex flex-col items-center">
            <div className="h-1 w-[1.5px] bg-stone-500/70 dark:bg-stone-400/60" />
            <div
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                isDark
                  ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]'
                  : 'bg-stone-400 shadow-xs'
              }`}
            />
          </div>
        </div>
      </button>

      {/* Floating Pill Label / Tooltip Badge (Visible on hover or mobile) */}
      <div
        className={`pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 z-50 shadow-md border ${
          isHovered
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-1 scale-95'
        } ${
          isDark
            ? 'bg-slate-900/95 text-amber-300 border-amber-500/30'
            : 'bg-white/95 text-slate-700 border-slate-200'
        }`}
      >
        {isDark ? 'Dark (Lit)' : 'Light (Off)'}
      </div>
    </div>
  )
}
