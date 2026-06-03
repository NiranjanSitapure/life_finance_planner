import { useStore } from '../../store/useStore'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'inputs', label: 'Parameters', icon: '⚙' },
  { id: 'projections', label: 'Projections', icon: '≡' },
  { id: 'charts', label: 'Charts', icon: '◫' },
  { id: 'milestones', label: 'Milestones', icon: '⚑' },
  { id: 'debts', label: 'Debts', icon: '◎' },
  { id: 'income-events', label: 'Income Events', icon: '✦' },
  { id: 'scenarios', label: 'Scenarios', icon: '⊞' },
  { id: 'montecarlo', label: 'Monte Carlo', icon: '∿' },
]

export function Sidebar() {
  const { activeSection, setActiveSection, summary } = useStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-slate-900 border-r border-slate-700 fixed left-0 top-0 z-40">
        <div className="p-4 border-b border-slate-700">
          <div className="text-teal-400 font-bold text-sm tracking-wider uppercase">Life Finance</div>
          <div className="text-slate-500 text-xs mt-0.5">Planner</div>
        </div>

        {summary.deficitYears.length > 0 && (
          <div className="mx-3 mt-3 p-2 bg-red-900/40 border border-red-700 rounded text-red-400 text-xs">
            ⚠ Portfolio deficit at age {summary.deficitYears[0]}
          </div>
        )}

        {summary.rothPhaseOutWarning && (
          <div className="mx-3 mt-2 p-2 bg-yellow-900/40 border border-yellow-700 rounded text-yellow-400 text-xs">
            ⚠ Roth phase-out applies
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 mt-2">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2.5 transition-colors ${
                activeSection === item.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700 text-slate-600 text-xs">
          All data stored locally
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex overflow-x-auto">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors ${
              activeSection === item.id ? 'text-teal-400' : 'text-slate-500'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </>
  )
}
