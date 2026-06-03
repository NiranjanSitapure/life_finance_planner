import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { Milestone } from '../../engine/types'
import { fmtCurrency } from '../../utils/formatters'
import { nanoid } from '../../utils/nanoid'

function MilestoneCard({ milestone, onEdit, onDelete, onToggle, inflatedCost }: {
  milestone: Milestone
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  inflatedCost: number
}) {
  return (
    <div className={`bg-slate-700/50 border rounded-xl p-4 flex items-start justify-between gap-3 ${milestone.enabled ? 'border-slate-600' : 'border-slate-700 opacity-50'}`}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${milestone.enabled ? 'bg-teal-600 border-teal-600' : 'border-slate-500'}`}>
          {milestone.enabled && <span className="text-white text-xs">✓</span>}
        </button>
        <div>
          <div className="text-slate-200 text-sm font-medium">{milestone.label}</div>
          <div className="text-slate-400 text-xs mt-0.5">Age {milestone.age}</div>
          <div className="flex gap-3 mt-1">
            <span className="text-slate-400 text-xs">Today: <span className="font-mono-nums text-slate-300">{fmtCurrency(milestone.cost)}</span></span>
            <span className="text-amber-400 text-xs">Inflated: <span className="font-mono-nums">{fmtCurrency(inflatedCost)}</span></span>
          </div>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-600 rounded transition-colors text-xs">✏</button>
        <button onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors text-xs">✕</button>
      </div>
    </div>
  )
}

interface EditState {
  id: string | null
  age: number
  label: string
  cost: number
}

export function MilestoneManager() {
  const { inputs, setInputs } = useStore()
  const [editing, setEditing] = useState<EditState | null>(null)

  const startNew = () => setEditing({ id: null, age: inputs.currentAge + 5, label: '', cost: 10000 })
  const startEdit = (m: Milestone) => setEditing({ id: m.id, age: m.age, label: m.label, cost: m.cost })
  const cancel = () => setEditing(null)

  const save = () => {
    if (!editing) return
    const updated = editing.id
      ? inputs.milestones.map(m => m.id === editing.id ? { ...m, age: editing.age, label: editing.label, cost: editing.cost } : m)
      : [...inputs.milestones, { id: nanoid(), age: editing.age, label: editing.label, cost: editing.cost, enabled: true }]
    setInputs({ milestones: updated.sort((a, b) => a.age - b.age) })
    setEditing(null)
  }

  const del = (id: string) => setInputs({ milestones: inputs.milestones.filter(m => m.id !== id) })
  const toggle = (id: string) => setInputs({ milestones: inputs.milestones.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m) })

  function inflated(m: Milestone) {
    return m.cost * Math.pow(1 + inputs.inflation, Math.max(0, m.age - inputs.currentAge))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={startNew}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors">
          + Add Milestone
        </button>
      </div>

      {editing && (
        <div className="bg-slate-800 border border-teal-700 rounded-xl p-5 space-y-4">
          <h4 className="text-slate-200 font-medium text-sm">{editing.id ? 'Edit' : 'New'} Milestone</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Label</label>
              <input type="text" value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Age</label>
              <input type="number" value={editing.age} min={inputs.currentAge} max={90}
                onChange={e => setEditing({ ...editing, age: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Cost (today's $)</label>
              <input type="number" value={editing.cost} min={0} step={1000}
                onChange={e => setEditing({ ...editing, cost: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
            </div>
          </div>
          {editing.cost > 0 && (
            <div className="text-amber-400 text-xs">
              Inflated cost at age {editing.age}: {fmtCurrency(editing.cost * Math.pow(1 + inputs.inflation, Math.max(0, editing.age - inputs.currentAge)))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg">Save</button>
            <button onClick={cancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {inputs.milestones.length === 0 && !editing && (
        <div className="text-center py-10 text-slate-500 text-sm">No milestones yet. Add your first one!</div>
      )}

      <div className="space-y-3">
        {inputs.milestones.map(m => (
          <MilestoneCard key={m.id} milestone={m} inflatedCost={inflated(m)}
            onEdit={() => startEdit(m)} onDelete={() => del(m.id)} onToggle={() => toggle(m.id)} />
        ))}
      </div>
    </div>
  )
}
