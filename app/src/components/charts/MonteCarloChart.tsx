import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useStore } from '../../store/useStore'
import { runMonteCarlo } from '../../engine/monteCarlo'
import { fmtCurrency, fmtPct } from '../../utils/formatters'

export function MonteCarloChart() {
  const { inputs, setMonteCarlo, monteCarlo, mcRunning, setMcRunning, setMcProgress, mcProgress } = useStore()
  const [numSims, setNumSims] = useState(1000)

  const handleRun = () => {
    setMcRunning(true)
    setMcProgress(0)
    setTimeout(() => {
      const result = runMonteCarlo(inputs, numSims, (pct) => setMcProgress(pct))
      setMonteCarlo(result)
      setMcRunning(false)
      setMcProgress(100)
    }, 50)
  }

  const chartData = monteCarlo
    ? monteCarlo.ages.map((age, i) => ({
        age,
        p10: monteCarlo.percentiles.p10[i],
        p25: monteCarlo.percentiles.p25[i],
        p50: monteCarlo.percentiles.p50[i],
        p75: monteCarlo.percentiles.p75[i],
        p90: monteCarlo.percentiles.p90[i],
      }))
    : []

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-gray-800 font-medium">Monte Carlo Simulation</h3>
        <div className="flex items-center gap-3">
          <select
            value={numSims}
            onChange={e => setNumSims(Number(e.target.value))}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-500"
          >
            <option value={100}>100 runs</option>
            <option value={500}>500 runs</option>
            <option value={1000}>1,000 runs</option>
            <option value={2000}>2,000 runs</option>
            <option value={5000}>5,000 runs</option>
          </select>
          <button
            onClick={handleRun}
            disabled={mcRunning}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {mcRunning ? `Running... ${mcProgress}%` : 'Run Simulation'}
          </button>
        </div>
      </div>

      {mcRunning && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${mcProgress}%` }}
          />
        </div>
      )}

      {monteCarlo && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
              <div className="text-gray-500 text-xs mb-1">Survive to 90</div>
              <div className="text-emerald-600 font-mono-nums text-lg font-semibold">
                {fmtPct(monteCarlo.probSurviveTo90)}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
              <div className="text-gray-500 text-xs mb-1">Hit FIRE Number</div>
              <div className="text-violet-600 font-mono-nums text-lg font-semibold">
                {fmtPct(monteCarlo.probHitFire)}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
              <div className="text-gray-500 text-xs mb-1">Median Retirement NW</div>
              <div className="text-indigo-600 font-mono-nums text-lg font-semibold">
                {fmtCurrency(monteCarlo.medianRetirementNW, true)}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
              <div className="text-gray-500 text-xs mb-1">90% CI Range</div>
              <div className="text-amber-600 font-mono-nums text-sm font-semibold">
                {fmtCurrency(monteCarlo.ci90Low, true)} – {fmtCurrency(monteCarlo.ci90High, true)}
              </div>
            </div>
          </div>

          {/* Fan chart */}
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="age" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => fmtCurrency(v, true)} width={65} />
              <Tooltip
                formatter={(v) => fmtCurrency(v != null ? Number(v) : 0, true)}
                contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#374151' }}
                labelFormatter={v => `Age ${v}`}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
              <Area type="monotone" dataKey="p90" name="90th pct" fill="#6366f1" stroke="#6366f1" fillOpacity={0.15} strokeWidth={1} />
              <Area type="monotone" dataKey="p75" name="75th pct" fill="#6366f1" stroke="#6366f1" fillOpacity={0.20} strokeWidth={1} />
              <Area type="monotone" dataKey="p50" name="Median" fill="#6366f1" stroke="#6366f1" fillOpacity={0.30} strokeWidth={2.5} />
              <Area type="monotone" dataKey="p25" name="25th pct" fill="#ef4444" stroke="#ef4444" fillOpacity={0.20} strokeWidth={1} />
              <Area type="monotone" dataKey="p10" name="10th pct" fill="#ef4444" stroke="#ef4444" fillOpacity={0.25} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="text-gray-400 text-xs">
            Randomizes stock returns (σ=15%), bond returns (σ=5%), inflation (σ=1%), salary growth (σ=2%).
            30% of simulations include a sequence-of-returns stress test in early retirement.
          </div>
        </>
      )}

      {!monteCarlo && !mcRunning && (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          Click "Run Simulation" to generate probabilistic outcomes
        </div>
      )}
    </div>
  )
}
