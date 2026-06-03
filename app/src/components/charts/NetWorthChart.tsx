import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
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

export function NetWorthChart() {
  const { rows, summary, inputs, scenarios } = useStore()

  const data = rows.map(r => ({
    age: r.age,
    nominal: r.netWorth,
    real: r.realNetWorth,
  }))

  const milestoneAges = inputs.milestones.filter(m => m.enabled).map(m => m.age)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-200 font-medium">Net Worth Over Time</h3>
        <div className="text-slate-500 text-xs">Inflation-adjusted in gray</div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickFormatter={v => fmtCurrency(v, true)}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />

          {/* FIRE target line */}
          <ReferenceLine
            y={summary.fireNumber}
            stroke="#8b5cf6"
            strokeDasharray="6 3"
            label={{ value: 'FIRE', fill: '#8b5cf6', fontSize: 11, position: 'insideTopRight' }}
          />

          {/* Retirement age */}
          <ReferenceLine
            x={inputs.retirementAge}
            stroke="#14b8a6"
            strokeDasharray="4 4"
            label={{ value: 'Retire', fill: '#14b8a6', fontSize: 10, position: 'insideTopLeft' }}
          />

          {/* Milestone ages */}
          {milestoneAges.map(a => (
            <ReferenceLine key={a} x={a} stroke="#f59e0b" strokeDasharray="2 4" strokeOpacity={0.5} />
          ))}

          {/* Scenario lines */}
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

          <Line type="monotone" dataKey="real" name="Real (today's $)" stroke="#64748b" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="nominal" name="Nominal" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
