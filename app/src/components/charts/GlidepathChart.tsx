import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { useStore } from '../../store/useStore'

export function GlidepathChart() {
  const { rows } = useStore()

  const data = useMemo(() => rows.map(r => ({
    age: r.age,
    stocks: Math.round(r.stockAllocationPct * 100),
    bonds: Math.round((1 - r.stockAllocationPct) * 100),
  })), [rows])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h3 className="text-slate-200 font-medium mb-4">Asset Allocation Glide Path</h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} width={45} />
          <Tooltip
            formatter={(v) => (v != null ? `${v}%` : '')}
            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <Area type="monotone" dataKey="stocks" name="Stocks %" stackId="1" fill="#14b8a6" stroke="#14b8a6" fillOpacity={0.7} />
          <Area type="monotone" dataKey="bonds" name="Bonds %" stackId="1" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.7} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
