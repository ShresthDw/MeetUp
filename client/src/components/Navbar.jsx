import { useState } from 'react'
import { Sparkles, Video, User, LogOut, Shield, Zap, Globe, MessageSquare } from 'lucide-react'

export default function Navbar({ user, onlineCount = 1, onLogout, onOpenAuth, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#223640]/80 bg-[#142229]/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand - Leo Cerso Style with Iconic Yellow Dot */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate?.('home')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#E09800] shadow-lg shadow-[#E09800]/30">
            <Video className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xl font-black tracking-tight text-white uppercase">
                MeetUp<span className="text-[#E09800]">.</span>
              </span>
              <span className="rounded-full bg-[#E09800]/15 px-2 py-0.5 text-[10px] font-bold text-[#E09800] border border-[#E09800]/40">
                LIVE
              </span>
            </div>
            <p className="text-[10px] tracking-wide text-slate-400 uppercase hidden sm:block font-medium">1-on-1 Video Chat</p>
          </div>
        </div>

        {/* Live Traffic Badge - Real Socket Count */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-[#223640] bg-[#1a2d36]/80 px-3.5 py-1.5 text-xs text-slate-300 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="font-mono font-bold text-emerald-400">{Number(onlineCount).toLocaleString()}</span>
          <span className="text-slate-400">{onlineCount === 1 ? 'stranger online' : 'strangers online'}</span>
        </div>

        {/* Action Controls & Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-full border border-[#223640] bg-[#1a2d36]/80 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E09800] text-xs font-bold text-white shadow-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-400">Verified Member</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#223640] bg-[#1a2d36] text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1 rounded-full bg-[#1a2d36]/60 border border-[#223640]">
                <Zap className="h-3 w-3 text-[#E09800]" />
                <span>Guest Mode Active</span>
              </div>

              <button
                onClick={() => onOpenAuth('login')}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1a2d36] transition"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                style={{ backgroundColor: '#E09800', color: '#ffffff', border: '1px solid #FFB82E' }}
                className="btn-yellow-primary flex items-center gap-1.5 rounded-xl bg-[#E09800] hover:bg-[#C78600] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#E09800]/30 hover:brightness-105 transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 fill-white text-white" />
                <span className="text-white font-bold">Sign Up Free</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
