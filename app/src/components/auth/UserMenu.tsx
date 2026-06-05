import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export function UserMenu() {
  const { user, logout, saveStatus } = useAuth()
  const [open, setOpen] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  if (!user) return null
  const initial = (user.name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()

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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
        aria-label="Open user menu"
      >
        {statusDot}
        {user.avatarUrl && !imgFailed
          ? <img src={user.avatarUrl} alt="" onError={() => setImgFailed(true)} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full" />
          : <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">{initial}</div>
        }
        <span className="text-slate-200 text-sm max-w-32 truncate">{user.name || user.email}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-64 py-1 text-sm">
            <div className="px-3 py-3 border-b border-slate-700 flex items-center gap-3">
              {user.avatarUrl && !imgFailed
                ? <img src={user.avatarUrl} alt="" onError={() => setImgFailed(true)} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full" />
                : <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">{initial}</div>
              }
              <div className="min-w-0">
                <div className="text-slate-100 font-medium truncate">{user.name}</div>
                <div className="text-slate-500 text-xs truncate">{user.email}</div>
              </div>
            </div>
            <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-700">
              {saveStatus === 'saving' && 'Saving your changes…'}
              {saveStatus === 'saved' && 'All changes saved to cloud'}
              {saveStatus === 'error' && 'Could not save — will retry'}
              {saveStatus === 'idle' && 'Synced'}
            </div>
            <button
              onClick={async () => { setOpen(false); await logout() }}
              className="w-full text-left px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M19 10a.75.75 0 00-.22-.53l-2.5-2.5a.75.75 0 10-1.06 1.06l1.22 1.22H8.75a.75.75 0 000 1.5h7.69l-1.22 1.22a.75.75 0 101.06 1.06l2.5-2.5A.75.75 0 0019 10z" clipRule="evenodd" />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
