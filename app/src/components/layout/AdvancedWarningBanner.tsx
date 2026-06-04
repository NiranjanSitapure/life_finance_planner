import { useStore } from '../../store/useStore'

export function AdvancedWarningBanner() {
  const { showAdvancedWarning, dismissAdvancedWarning } = useStore()

  if (!showAdvancedWarning) return null

  return (
    <div className="bg-amber-900/40 border border-amber-600 rounded-xl px-4 py-3 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="text-amber-400 text-lg flex-shrink-0">⚠</span>
        <div>
          <div className="text-amber-300 text-sm font-medium">
            Parameters filled with average values
          </div>
          <div className="text-amber-400/80 text-xs mt-0.5">
            Your advanced settings have been pre-populated with defaults. Please review and configure each section to match your actual financial situation and lifestyle — especially your account balances, tax rate, and investment returns.
          </div>
        </div>
      </div>
      <button
        onClick={dismissAdvancedWarning}
        className="text-amber-500 hover:text-amber-300 text-lg flex-shrink-0 transition-colors leading-none"
      >
        ✕
      </button>
    </div>
  )
}
