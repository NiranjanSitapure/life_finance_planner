import { useStore } from '../../store/useStore'
import { fmtCurrency, fmtAge } from '../../utils/formatters'
import { DEFAULT_INPUTS } from '../../engine/defaults'
import { runProjection } from '../../engine/model'
import { sanitizeInputs } from '../../engine/validate'
import { nanoid } from '../../utils/nanoid'

const PRESETS = [
  { name: 'Base Case', overrides: {} },
  { name: 'Bull Market', overrides: { stockReturn: 0.10, k401Return: 0.10 } },
  { name: 'Bear Market', overrides: { stockReturn: 0.05, k401Return: 0.05 } },
  { name: 'Early Retire (55)', overrides: { retirementAge: 55 } },
  { name: 'High Inflation', overrides: { inflation: 0.05 } },
  { name: 'No Social Security', overrides: { socialSecurityEnabled: false } },
]

const COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899']

export function ScenarioPanel() {
  const { scenarios, deleteScenario } = useStore()

  const addPreset = (preset: typeof PRESETS[0]) => {
    // sanitizeInputs ensures preset overrides can't inject malformed values
    const presetInputs = sanitizeInputs({ ...DEFAULT_INPUTS, ...preset.overrides })
    const { rows, summary } = runProjection(presetInputs)
    useStore.setState(state => ({
      scenarios: [...state.scenarios, {
        id: nanoid(),
        name: preset.name,
        color: COLORS[state.scenarios.length % COLORS.length],
        inputs: presetInputs,
        rows,
        summary,
      }]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h4 className="text-gray-800 font-medium text-sm mb-4">Add Preset Scenario</h4>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => addPreset(p)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs rounded-lg transition-colors">
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-3">
          Tip: Use "Save Scenario" in Parameters to add your current settings as a custom scenario.
        </p>
      </div>

      {/* Scenario comparison table */}
      {scenarios.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-gray-800 font-medium text-sm">Comparison</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium">Scenario</th>
                  <th className="text-right px-4 py-2.5 font-medium">Retirement NW</th>
                  <th className="text-right px-4 py-2.5 font-medium">4% Income</th>
                  <th className="text-right px-4 py-2.5 font-medium">First $1M</th>
                  <th className="text-right px-4 py-2.5 font-medium">FIRE Age</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map(s => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono-nums text-right text-indigo-600">
                      {fmtCurrency(s.summary.retirementNetWorth, true)}
                    </td>
                    <td className="px-4 py-2.5 font-mono-nums text-right text-gray-700">
                      {fmtCurrency(s.summary.safeWithdrawalIncome, true)}
                    </td>
                    <td className="px-4 py-2.5 font-mono-nums text-right text-amber-600">
                      {fmtAge(s.summary.firstMillionAge)}
                    </td>
                    <td className="px-4 py-2.5 font-mono-nums text-right text-violet-600">
                      {fmtAge(s.summary.fireAge)}
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => deleteScenario(s.id)}
                        className="text-gray-400 hover:text-rose-600 transition-colors">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scenarios.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          Add preset scenarios or save your current parameters as a named scenario.
        </div>
      )}
    </div>
  )
}
