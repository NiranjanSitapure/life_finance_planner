import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { useStore } from '../../store/useStore'
import { fmtCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs space-y-1 shadow-xl">
      <div className="text-slate-300 font-medium mb-1">Age {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono-nums text-slate-100">{fmtCurrency(p.value, true)}</span>
        </div>
      ))}
    </div>
  )
}

export function DrawdownChart() {
  const { rows, inputs } = useStore()

  const retirementRows = rows.filter(r => r.age >= inputs.retirementAge)

  const data = retirementRows.map(r => ({
    age: r.age,
    netWorth: Math.max(0, r.netWorth),
    spending: r.livingExpenses,
    socialSecurity: r.socialSecurityIncome,
  }))

  const depletionRow = retirementRows.find(r => r.portfolioDeficit)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-200 font-medium">Retirement Drawdown</h3>
        {depletionRow ? (
          <span className="text-red-400 text-xs bg-red-900/40 px-2 py-1 rounded">
            ⚠ Depletion at age {depletionRow.age}
          </span>
        ) : (
          <span className="text-emerald-400 text-xs bg-emerald-900/40 px-2 py-1 rounded">
            ✓ Portfolio survives
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => fmtCurrency(v, true)} width={65} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          {depletionRow && (
            <ReferenceLine x={depletionRow.age} stroke="#ef4444" strokeDasharray="4 4"
              label={{ value: 'Depleted', fill: '#ef4444', fontSize: 10 }} />
          )}
          <Line type="monotone" dataKey="netWorth" name="Portfolio Balance" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="spending" name="Annual Spending" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="socialSecurity" name="Social Security" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
