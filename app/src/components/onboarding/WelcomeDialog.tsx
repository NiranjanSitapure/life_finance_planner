import { useStore } from '../../store/useStore'

export function WelcomeDialog() {
  const { dismissWelcome } = useStore()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="text-5xl">📊</div>
            <h2 className="text-2xl font-bold text-slate-100">Welcome to Life Finance Planner</h2>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed text-center">
            Plan your entire financial life — from today's savings to retirement. All calculations run privately in your browser; nothing is ever sent to a server.
          </p>

          <ul className="space-y-2.5">
            {([
              ['📈', 'Retirement projections — year-by-year net worth to age 90'],
              ['🏦', 'Account modeling — 401(k), Roth IRA, HSA, brokerage'],
              ['💳', 'Debt payoff — mortgage, student loans, car payments'],
              ['🎲', 'Monte Carlo simulation — probability your money lasts'],
              ['🏠', 'Life milestones — home, college, big purchases'],
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
