import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { useStore } from '../../store/useStore'
import { fmtCurrency } from '../../utils/formatters'
import type { ChartTooltipProps } from '../../utils/chartTypes'

const COLORS = {
  k401: '#6366f1',
  rothIRA: '#8b5cf6',
  hsa: '#ec4899',
  stocks: '#14b8a6',
  bonds: '#3b82f6',
  cash: '#f59e0b',
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs space-y-1 shadow-xl">
      <div className="text-slate-300 font-medium mb-1">Age {label}</div>
      {[...payload].reverse().map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-mono-nums text-slate-100">{fmtCurrency(p.value, true)}</span>
        </div>
      ))}
      <div className="border-t border-slate-600 pt-1 flex justify-between gap-4 font-medium">
        <span className="text-slate-300">Total</span>
        <span className="font-mono-nums text-teal-400">{fmtCurrency(total, true)}</span>
      </div>
    </div>
  )
}

export function AssetBreakdownChart() {
  const { rows } = useStore()

  const data = useMemo(() => rows.map(r => ({
    age: r.age,
    k401: Math.max(0, r.k401),
    rothIRA: Math.max(0, r.rothIRA),
    hsa: Math.max(0, r.hsa),
    stocks: Math.max(0, r.stocks),
    bonds: Math.max(0, r.bonds),
    cash: Math.max(0, r.cash),
  })), [rows])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h3 className="text-slate-200 font-medium mb-4">Asset Breakdown Over Time</h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => fmtCurrency(v, true)} width={65} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <Area type="monotone" dataKey="k401" name="401(k)" stackId="1" fill={COLORS.k401} stroke={COLORS.k401} fillOpacity={0.85} />
          <Area type="monotone" dataKey="rothIRA" name="Roth IRA" stackId="1" fill={COLORS.rothIRA} stroke={COLORS.rothIRA} fillOpacity={0.85} />
          <Area type="monotone" dataKey="hsa" name="HSA" stackId="1" fill={COLORS.hsa} stroke={COLORS.hsa} fillOpacity={0.85} />
          <Area type="monotone" dataKey="bonds" name="Bonds" stackId="1" fill={COLORS.bonds} stroke={COLORS.bonds} fillOpacity={0.85} />
          <Area type="monotone" dataKey="stocks" name="Stocks" stackId="1" fill={COLORS.stocks} stroke={COLORS.stocks} fillOpacity={0.85} />
          <Area type="monotone" dataKey="cash" name="Cash" stackId="1" fill={COLORS.cash} stroke={COLORS.cash} fillOpacity={0.85} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
