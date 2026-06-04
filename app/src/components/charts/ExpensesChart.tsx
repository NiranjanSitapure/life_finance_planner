import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
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
          <span style={{ color: p.fill || p.color }}>{p.name}</span>
          <span className="font-mono-nums text-gray-900">{fmtCurrency(p.value, true)}</span>
        </div>
      ))}
    </div>
  )
}

export function ExpensesChart() {
  const { rows, inputs } = useStore()

  const data = useMemo(() => rows
    .filter(r => r.age <= inputs.retirementAge + 5)
    .map(r => ({
      age: r.age,
      living: Math.round(r.livingExpenses),
      milestones: Math.round(r.milestoneCost),
      debt: Math.round(r.debtPayments),
      income: Math.round(r.postTaxIncome),
    })), [rows, inputs.retirementAge])

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-gray-800 font-medium mb-4">Annual Expenses vs Post-Tax Income</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="age" stroke="#9ca3af" tick={{ fontSize: 11 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => fmtCurrency(v, true)} width={65} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
          <ReferenceLine x={inputs.retirementAge} stroke="#6366f1" strokeDasharray="4 4" />
          <Bar dataKey="income" name="Post-Tax Income" fill="#10b981" fillOpacity={0.4} />
          <Bar dataKey="living" name="Living Expenses" fill="#ef4444" stackId="exp" fillOpacity={0.85} />
          <Bar dataKey="debt" name="Debt Payments" fill="#f97316" stackId="exp" fillOpacity={0.85} />
          <Bar dataKey="milestones" name="Milestones" fill="#f59e0b" stackId="exp" fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
