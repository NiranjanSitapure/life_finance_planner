import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export function UserMenu() {
  const { user, logout, saveStatus } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const statusDot = saveStatus === 'saving'
    ? <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Saving…" />
    : saveStatus === 'saved'
    ? <span className="w-2 h-2 rounded-full bg-emerald-400" title="Saved" />
    : saveStatus === 'error'
    ? <span className="w-2 h-2 rounded-full bg-red-400" title="Save failed" />
    : null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
      >
        {statusDot}
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full" />
          : <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">{user.name[0]}</div>
        }
        <span className="text-slate-300 text-xs hidden sm:block max-w-24 truncate">{user.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-48 py-1 text-sm">
            <div className="px-3 py-2 border-b border-slate-700">
              <div className="text-slate-200 font-medium truncate">{user.name}</div>
              <div className="text-slate-500 text-xs truncate">{user.email}</div>
            </div>
            <button
              onClick={async () => { setOpen(false); await logout() }}
              className="w-full text-left px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
