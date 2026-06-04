import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { useStore } from '../../store/useStore'
import { fmtCurrency } from '../../utils/formatters'
import type { ChartTooltipProps } from '../../utils/chartTypes'

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs space-y-1 shadow-xl">
      <div className="text-gray-700 font-medium mb-1">Age {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono-nums text-gray-900">{fmtCurrency(p.value, true)}</span>
        </div>
      ))}
    </div>
  )
}

export function DrawdownChart() {
  const { rows, inputs } = useStore()

  const retirementRows = useMemo(
    () => rows.filter(r => r.age >= inputs.retirementAge),
    [rows, inputs.retirementAge]
  )

  const data = useMemo(() => retirementRows.map(r => ({
    age: r.age,
    netWorth: Math.max(0, r.netWorth),
    spending: r.livingExpenses,
    socialSecurity: r.socialSecurityIncome,
  })), [retirementRows])

  const depletionRow = retirementRows.find(r => r.portfolioDeficit)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-800 font-medium">Retirement Drawdown</h3>
        {depletionRow ? (
          <span className="text-rose-600 text-xs bg-rose-50 border border-rose-200 px-2 py-1 rounded">
            ⚠ Depletion at age {depletionRow.age}
          </span>
        ) : (
          <span className="text-emerald-600 text-xs bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
            ✓ Portfolio survives
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="age" stroke="#9ca3af" tick={{ fontSize: 11 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => fmtCurrency(v, true)} width={65} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
          {depletionRow && (
            <ReferenceLine x={depletionRow.age} stroke="#ef4444" strokeDasharray="4 4"
              label={{ value: 'Depleted', fill: '#ef4444', fontSize: 10 }} />
          )}
          <Line type="monotone" dataKey="netWorth" name="Portfolio Balance" stroke="#6366f1" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="spending" name="Annual Spending" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="socialSecurity" name="Social Security" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
