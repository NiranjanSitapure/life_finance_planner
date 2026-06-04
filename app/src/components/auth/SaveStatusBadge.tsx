import { useAuth } from '../../contexts/AuthContext'

export function SaveStatusBadge() {
  const { saveStatus, user } = useAuth()
  if (!user || saveStatus === 'idle') return null

  const map = {
    saving: { text: 'Saving…', cls: 'text-amber-400' },
    saved:  { text: '✓ Saved',  cls: 'text-emerald-400' },
    error:  { text: 'Save failed', cls: 'text-red-400' },
  } as const

  const { text, cls } = map[saveStatus]
  return <span className={`text-xs font-medium transition-opacity ${cls}`}>{text}</span>
}
