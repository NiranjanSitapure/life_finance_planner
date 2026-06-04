import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
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

export function NetWorthChart() {
  const { rows, summary, inputs, scenarios } = useStore()

  const data = useMemo(() => rows.map(r => ({
    age: r.age,
    nominal: r.netWorth,
    real: r.realNetWorth,
  })), [rows])

  const milestoneAges = useMemo(
    () => inputs.milestones.filter(m => m.enabled).map(m => m.age),
    [inputs.milestones]
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-800 font-medium">Net Worth Over Time</h3>
        <div className="text-gray-400 text-xs">Inflation-adjusted in gray</div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="age" stroke="#9ca3af" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 11 }}
            tickFormatter={v => fmtCurrency(v, true)}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#6b7280' }} />

          <ReferenceLine
            y={summary.fireNumber}
            stroke="#8b5cf6"
            strokeDasharray="6 3"
            label={{ value: 'FIRE', fill: '#8b5cf6', fontSize: 11, position: 'insideTopRight' }}
          />
          <ReferenceLine
            x={inputs.retirementAge}
            stroke="#6366f1"
            strokeDasharray="4 4"
            label={{ value: 'Retire', fill: '#6366f1', fontSize: 10, position: 'insideTopLeft' }}
          />
          {milestoneAges.map(a => (
            <ReferenceLine key={a} x={a} stroke="#f59e0b" strokeDasharray="2 4" strokeOpacity={0.5} />
          ))}
          {scenarios.map(s => (
            <Line
              key={s.id}
              data={s.rows.map(r => ({ age: r.age, [s.id]: r.netWorth }))}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stroke={s.color}
              strokeWidth={1.5}
              dot={false}
              strokeOpacity={0.6}
              strokeDasharray="4 2"
            />
          ))}
          <Line type="monotone" dataKey="real" name="Real (today's $)" stroke="#9ca3af" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="nominal" name="Nominal" stroke="#6366f1" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
