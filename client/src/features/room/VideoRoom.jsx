import { useState } from 'react'

import { useVideoRoom } from './useVideoRoom'

export default function VideoRoom({ user, onLogout }) {
  const room = useVideoRoom()
  const [text, setText] = useState('')

  const submitMessage = (event) => {
    if (room.sendMessage(event, text)) setText('')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,#f8fafc_50%,#dbeafe)] p-4 text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">MeetUp</h1>
            <p className="text-sm text-slate-600">
              Status: {room.status} {room.role ? `| ${room.role}` : ''}
            </p>
          </div>

          <div className="flex gap-2">
            <span className="hidden self-center text-sm text-slate-500 sm:inline">Hi, {user.name}</span>
            <button onClick={room.startMatching} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Join Queue</button>
            <button onClick={room.nextPeer} disabled={room.status !== 'connected'} className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Next Peer</button>
            <button onClick={onLogout} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Log out</button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <video ref={room.localVideoRef} autoPlay muted playsInline className="aspect-video w-full rounded-2xl bg-slate-900 object-cover" />
          <video ref={room.remoteVideoRef} autoPlay playsInline className="aspect-video w-full rounded-2xl bg-slate-900 object-cover" />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm text-slate-600">Room: {room.roomId || 'not connected'}</p>
          <div className="mb-3 h-56 overflow-y-auto rounded-xl bg-white p-2">
            {room.messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
            {room.messages.map((message, index) => (
              <div key={`${message.createdAt}-${index}`} className="mb-2 text-sm">
                <strong>{message.sender === room.socket.id ? 'You' : 'Peer'}:</strong> {message.text}
              </div>
            ))}
          </div>

          <form onSubmit={submitMessage} className="flex gap-2">
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Type a message" className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
            <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">Send</button>
          </form>

          {room.error && <p className="mt-2 text-sm text-red-600">{room.error}</p>}
        </section>
      </section>
    </main>
  )
}
