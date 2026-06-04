import { useStore } from '../../store/useStore'
import type { AppMode } from '../../store/useStore'

const MODES: { id: AppMode; label: string }[] = [
  { id: 'simple', label: 'Basic' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

export function ModeToggle() {
  const { mode, switchToSimple, switchToIntermediate, switchToAdvanced } = useStore()

  const handlers: Record<AppMode, () => void> = {
    simple: switchToSimple,
    intermediate: switchToIntermediate,
    advanced: switchToAdvanced,
  }

  return (
    <div className="flex items-center bg-slate-800 border border-slate-700 rounded-full p-1 gap-0.5">
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={handlers[m.id]}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            mode === m.id
              ? 'bg-teal-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
