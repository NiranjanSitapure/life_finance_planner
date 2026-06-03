import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
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
          <span style={{ color: p.fill || p.color }}>{p.name}</span>
          <span className="font-mono-nums text-slate-100">{fmtCurrency(p.value, true)}</span>
        </div>
      ))}
    </div>
  )
}

export function ExpensesChart() {
  const { rows, inputs } = useStore()

  // Only show pre-retirement for clarity
  const data = rows
    .filter(r => r.age <= inputs.retirementAge + 5)
    .map(r => ({
      age: r.age,
      living: Math.round(r.livingExpenses),
      milestones: Math.round(r.milestoneCost),
      debt: Math.round(r.debtPayments),
      income: Math.round(r.postTaxIncome),
    }))

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h3 className="text-slate-200 font-medium mb-4">Annual Expenses vs Post-Tax Income</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => fmtCurrency(v, true)} width={65} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <ReferenceLine x={inputs.retirementAge} stroke="#14b8a6" strokeDasharray="4 4" />
          <Bar dataKey="income" name="Post-Tax Income" fill="#14b8a6" fillOpacity={0.4} />
          <Bar dataKey="living" name="Living Expenses" fill="#ef4444" stackId="exp" fillOpacity={0.85} />
          <Bar dataKey="debt" name="Debt Payments" fill="#f97316" stackId="exp" fillOpacity={0.85} />
          <Bar dataKey="milestones" name="Milestones" fill="#f59e0b" stackId="exp" fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
