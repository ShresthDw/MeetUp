import { useState } from 'react'
import { X, Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react'
import { AUTH_TOKEN_KEY } from '../../config/env'
import { authenticate } from './authApi'

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authenticate(mode, form)
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      onAuthenticated(data.user)
      onClose()
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#243c47] bg-white dark:bg-[#1a2d36]/95 p-5 sm:p-8 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-[#122027] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#243c47] hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E09800] text-white shadow-md shadow-[#E09800]/25">
            {mode === 'login' ? <User className="h-6 w-6 text-white" /> : <UserPlus className="h-6 w-6 text-white" />}
          </div>
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}<span className="text-[#E09800]">.</span>
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {mode === 'login' 
              ? 'Sign in to access verified badges & priority matching.' 
              : 'Join the premier stranger chat network in seconds.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-[#122027] p-1 border border-slate-200 dark:border-[#243c47]">
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={mode === 'login' ? { backgroundColor: '#E09800', color: '#ffffff', border: '1px solid #FFB82E' } : {}}
            className={`rounded-lg py-2 text-xs font-black transition cursor-pointer ${
              mode === 'login' ? 'btn-yellow-primary bg-[#E09800] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            style={mode === 'register' ? { backgroundColor: '#E09800', color: '#ffffff', border: '1px solid #FFB82E' } : {}}
            className={`rounded-lg py-2 text-xs font-black transition cursor-pointer ${
              mode === 'register' ? 'btn-yellow-primary bg-[#E09800] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Full Name or Nickname</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  required
                  value={form.name}
                  onChange={updateField('name')}
                  placeholder="e.g. Alex"
                  className="w-full rounded-xl border border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#122027] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#E09800] focus:ring-1 focus:ring-[#E09800] transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                required
                type="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#122027] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#E09800] focus:ring-1 focus:ring-[#E09800] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                required
                type="password"
                minLength={mode === 'register' ? 6 : undefined}
                value={form.password}
                onChange={updateField('password')}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter password'}
                className="w-full rounded-xl border border-slate-200 dark:border-[#243c47] bg-slate-50 dark:bg-[#122027] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#E09800] focus:ring-1 focus:ring-[#E09800] transition"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#E09800', color: '#ffffff', border: '1px solid #FFB82E' }}
            className="btn-yellow-primary flex w-full items-center justify-center gap-2 rounded-xl bg-[#E09800] hover:bg-[#C78600] py-3.5 text-sm font-black text-white shadow-lg shadow-[#E09800]/30 hover:brightness-105 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Processing…
              </span>
            ) : (
              <>
                <span className="tracking-wide uppercase text-white font-black">{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Guest Footer */}
        <div className="mt-5 border-t border-slate-200 dark:border-[#243c47] pt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition underline underline-offset-4 cursor-pointer"
          >
            Or continue anonymously as a Guest →
          </button>
        </div>
      </div>
    </div>
  )
}
