import { useState } from 'react'

import { AUTH_TOKEN_KEY } from '../../config/env'
import { authenticate } from './authApi'

const initialForm = { name: '', email: '', password: '' }

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fef3c7,#f8fafc_50%,#dbeafe)] p-4 text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">M</div>
          <h1 className="font-serif text-3xl font-bold">Welcome to MeetUp</h1>
          <p className="mt-2 text-sm text-slate-500">Meet someone new, safely and instantly.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          {['login', 'register'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchMode(item)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${mode === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <label className="block text-sm font-medium">
              Name
              <input required value={form.name} onChange={updateField('name')} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="Your name" />
            </label>
          )}

          <label className="block text-sm font-medium">
            Email
            <input required type="email" value={form.email} onChange={updateField('email')} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="you@example.com" />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input required type="password" minLength={mode === 'register' ? 8 : undefined} value={form.password} onChange={updateField('password')} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} />
          </label>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  )
}
