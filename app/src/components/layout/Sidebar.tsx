import { useStore } from '../../store/useStore'
import type { AppMode } from '../../store/useStore'

const ALL_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦', modes: ['simple', 'intermediate', 'advanced'] },
  { id: 'inputs', label: 'Parameters', icon: '⚙', modes: ['intermediate', 'advanced'] },
  { id: 'projections', label: 'Projections', icon: '≡', modes: ['intermediate', 'advanced'] },
  { id: 'charts', label: 'Charts', icon: '◫', modes: ['intermediate', 'advanced'] },
  { id: 'milestones', label: 'Milestones', icon: '⚑', modes: ['advanced'] },
  { id: 'debts', label: 'Debts', icon: '◎', modes: ['advanced'] },
  { id: 'income-events', label: 'Income Events', icon: '✦', modes: ['advanced'] },
  { id: 'scenarios', label: 'Scenarios', icon: '⊞', modes: ['advanced'] },
  { id: 'montecarlo', label: 'Monte Carlo', icon: '∿', modes: ['advanced'] },
]

export function Sidebar() {
  const { activeSection, setActiveSection, summary, mode } = useStore()
  const NAV = ALL_NAV.filter(item => item.modes.includes(mode as AppMode))

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
        <div className="p-4 border-b border-gray-200">
          <div className="text-indigo-600 font-bold text-sm tracking-wider uppercase">Life Finance</div>
          <div className="text-gray-400 text-xs mt-0.5">Planner</div>
        </div>

        {summary.deficitYears.length > 0 && (
          <div className="mx-3 mt-3 p-2 bg-red-50 border border-red-300 rounded text-red-600 text-xs">
            ⚠ Portfolio deficit at age {summary.deficitYears[0]}
          </div>
        )}

        {summary.rothPhaseOutWarning && (
          <div className="mx-3 mt-2 p-2 bg-amber-50 border border-amber-300 rounded text-amber-600 text-xs">
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
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 text-gray-400 text-xs">
          All data stored locally
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex overflow-x-auto">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors ${
              activeSection === item.id ? 'text-indigo-600' : 'text-gray-400'
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
