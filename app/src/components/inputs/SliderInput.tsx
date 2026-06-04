import React from 'react'
import { InfoTooltip } from '../ui/InfoTooltip'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  hint?: string
  warning?: string
  tooltip?: string
}

export function SliderInput({ label, value, min, max, step, format, onChange, hint, warning, tooltip }: Props) {
  const [raw, setRaw] = React.useState('')
  const [editing, setEditing] = React.useState(false)

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <div className="flex items-center gap-1.5">
          <label className="text-slate-300 text-sm">{label}</label>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        {warning && <span className="text-yellow-400 text-xs">{warning}</span>}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-teal-500"
        />
        <input
          type="text"
          value={editing ? raw : format(value)}
          onFocus={() => { setEditing(true); setRaw(String(value)) }}
          onBlur={() => {
            setEditing(false)
            const n = parseFloat(raw)
            if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
          }}
          onChange={e => setRaw(e.target.value)}
          className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-right text-sm font-mono-nums text-slate-100 focus:outline-none focus:border-teal-500"
        />
      </div>
      {hint && <div className="text-slate-600 text-xs">{hint}</div>}
    </div>
  )
}
