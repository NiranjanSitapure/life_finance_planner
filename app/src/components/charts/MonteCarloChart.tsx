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
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-slate-200 font-medium">Monte Carlo Simulation</h3>
        <div className="flex items-center gap-3">
          <select
            value={numSims}
            onChange={e => setNumSims(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
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
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {mcRunning ? `Running... ${mcProgress}%` : 'Run Simulation'}
          </button>
        </div>
      </div>

      {mcRunning && (
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${mcProgress}%` }}
          />
        </div>
      )}

      {monteCarlo && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Survive to 90</div>
              <div className="text-emerald-400 font-mono-nums text-lg font-semibold">
                {fmtPct(monteCarlo.probSurviveTo90)}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Hit FIRE Number</div>
              <div className="text-violet-400 font-mono-nums text-lg font-semibold">
                {fmtPct(monteCarlo.probHitFire)}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Median Retirement NW</div>
              <div className="text-teal-400 font-mono-nums text-lg font-semibold">
                {fmtCurrency(monteCarlo.medianRetirementNW, true)}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">90% CI Range</div>
              <div className="text-amber-400 font-mono-nums text-sm font-semibold">
                {fmtCurrency(monteCarlo.ci90Low, true)} – {fmtCurrency(monteCarlo.ci90High, true)}
              </div>
            </div>
          </div>

          {/* Fan chart */}
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => fmtCurrency(v, true)} width={65} />
              <Tooltip
                formatter={(v: any) => fmtCurrency(v, true)}
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#cbd5e1' }}
                labelFormatter={v => `Age ${v}`}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="p90" name="90th pct" fill="#14b8a6" stroke="#14b8a6" fillOpacity={0.15} strokeWidth={1} />
              <Area type="monotone" dataKey="p75" name="75th pct" fill="#14b8a6" stroke="#14b8a6" fillOpacity={0.20} strokeWidth={1} />
              <Area type="monotone" dataKey="p50" name="Median" fill="#14b8a6" stroke="#14b8a6" fillOpacity={0.30} strokeWidth={2.5} />
              <Area type="monotone" dataKey="p25" name="25th pct" fill="#ef4444" stroke="#ef4444" fillOpacity={0.20} strokeWidth={1} />
              <Area type="monotone" dataKey="p10" name="10th pct" fill="#ef4444" stroke="#ef4444" fillOpacity={0.25} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="text-slate-500 text-xs">
            Randomizes stock returns (σ=15%), bond returns (σ=5%), inflation (σ=1%), salary growth (σ=2%).
            30% of simulations include a sequence-of-returns stress test in early retirement.
          </div>
        </>
      )}

      {!monteCarlo && !mcRunning && (
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
          Click "Run Simulation" to generate probabilistic outcomes
        </div>
      )}
    </div>
  )
}
