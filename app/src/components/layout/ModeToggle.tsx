import { useStore } from '../../store/useStore'

export function ModeToggle() {
  const { isSimpleMode, switchToSimple, switchToAdvanced } = useStore()

  return (
    <div className="flex items-center bg-slate-800 border border-slate-700 rounded-full p-1 gap-1">
      <button
        onClick={switchToSimple}
        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
          isSimpleMode
            ? 'bg-teal-600 text-white shadow'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Simple
      </button>
      <button
        onClick={switchToAdvanced}
        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
          !isSimpleMode
            ? 'bg-teal-600 text-white shadow'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Advanced
      </button>
    </div>
  )
}
