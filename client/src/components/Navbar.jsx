import { useState } from 'react'
import { UserPlus, Video, LogOut, Zap } from 'lucide-react'
import PendantThemeToggle from './PendantThemeToggle'

export default function Navbar({ user, onlineCount = 1, onLogout, onOpenAuth, onNavigate }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-[#223640]/80 bg-white/80 dark:bg-[#142229]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => onNavigate?.('home')}>
          <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-lamp-badge shadow-md">
            <Video className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                MeetUp<span className="text-[#964f26]">.</span>
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] tracking-wide text-slate-500 dark:text-slate-400 uppercase hidden sm:block font-medium">
              1-on-1 Video Chat
            </p>
          </div>
        </div>


        {/* Action Controls, Theme Toggle & Auth */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Murano Glass Orb Pendant Theme Switcher Button */}
          <div className="flex items-center px-1 sm:px-2">
            <PendantThemeToggle />
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-[#223640]" />

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#223640] bg-slate-100/80 dark:bg-[#1a2d36]/80 px-2.5 sm:px-3 py-1 sm:py-1.5">
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-lamp-badge text-xs font-bold text-white shadow-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Verified Member</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log out"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-[#223640] bg-slate-100 dark:bg-[#1a2d36] text-slate-600 dark:text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#1a2d36]/60 border border-slate-200 dark:border-[#223640]">
                <Zap className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                <span>Guest Mode Active</span>
              </div>

              <button
                onClick={() => onOpenAuth('login')}
                className="rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2d36] transition cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="btn-lamp-primary flex items-center gap-1 sm:gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5 text-white" />
                <span className="text-white font-bold">Sign Up</span>
                <span className="hidden sm:inline text-white font-bold">Free</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
