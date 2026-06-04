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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-gray-800 font-medium mb-4">Asset Allocation Glide Path</h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="age" stroke="#9ca3af" tick={{ fontSize: 11 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} width={45} />
          <Tooltip
            formatter={(v) => (v != null ? `${v}%` : '')}
            contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#374151' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
          <Area type="monotone" dataKey="stocks" name="Stocks %" stackId="1" fill="#10b981" stroke="#10b981" fillOpacity={0.7} />
          <Area type="monotone" dataKey="bonds" name="Bonds %" stackId="1" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.7} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
