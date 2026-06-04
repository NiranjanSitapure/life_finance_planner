import { useStore } from '../../store/useStore'

export function WelcomeDialog() {
  const { dismissWelcome } = useStore()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="text-5xl">📊</div>
            <h2 className="text-xl font-bold text-slate-100">Life Finance Planner</h2>
          </div>

          <p className="text-slate-200 text-base font-medium text-center">
            Can you afford to retire when you want to?
          </p>

          <ul className="space-y-2.5">
            {([
              ['🎯', 'Works on your actual salary, savings, and age — not guesses'],
              ['🏦', '401(k), Roth IRA, HSA, brokerage — each modeled separately'],
              ['🏠', 'Plan for the house, the kids\' college, the career break'],
              ['📉', 'Stress-test against bear markets and high inflation'],
              ['🔒', 'No login needed — data is never stored'],
            ] as [string, string][]).map(([icon, text]) => (
              <li key={text} className="flex items-start gap-2.5 text-slate-300 text-sm">
                <span className="mt-0.5 shrink-0">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={dismissWelcome}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  )
}
