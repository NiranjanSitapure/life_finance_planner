import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { IncomeEvent } from '../../engine/types'
import { fmtCurrency } from '../../utils/formatters'
import { nanoid } from '../../utils/nanoid'

interface EditState {
  id: string | null
  age: number
  label: string
  amount: number
  taxable: boolean
}

function EventCard({ event, onEdit, onDelete }: {
  event: IncomeEvent
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-gray-800 text-sm font-medium">{event.label}</div>
        <div className="text-gray-500 text-xs mt-0.5">Age {event.age} · {event.taxable ? 'Taxable' : 'Tax-free'}</div>
        <div className="mt-1.5 text-xs">
          <span className="text-emerald-600 font-mono-nums font-medium">{fmtCurrency(event.amount)}</span>
          <span className="text-gray-400 ml-1">gross</span>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded text-xs">✏</button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded text-xs">✕</button>
      </div>
    </div>
  )
}

export function IncomeEventManager() {
  const { inputs, setInputs } = useStore()
  const [editing, setEditing] = useState<EditState | null>(null)

  const startNew = () => setEditing({
    id: null, age: inputs.currentAge + 5, label: '', amount: 50000, taxable: true
  })
  const startEdit = (e: IncomeEvent) => setEditing({
    id: e.id, age: e.age, label: e.label, amount: e.amount, taxable: e.taxable
  })
  const cancel = () => setEditing(null)

  const save = () => {
    if (!editing || !editing.label.trim()) return
    const updated = editing.id
      ? inputs.incomeEvents.map(e => e.id === editing.id ? { ...editing, id: e.id } : e)
      : [...inputs.incomeEvents, { ...editing, id: nanoid() }]
    setInputs({ incomeEvents: updated.sort((a, b) => a.age - b.age) })
    setEditing(null)
  }

  const del = (id: string) => setInputs({ incomeEvents: inputs.incomeEvents.filter(e => e.id !== id) })

  const EXAMPLES = [
    { label: 'Annual Bonus', amount: 50000, taxable: true },
    { label: 'RSU Vest', amount: 150000, taxable: true },
    { label: 'Inheritance', amount: 200000, taxable: false },
    { label: 'Home Sale Proceeds', amount: 300000, taxable: false },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={startNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
          + Add Income Event
        </button>
      </div>

      {/* Quick-add examples */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map(ex => (
          <button key={ex.label}
            onClick={() => setEditing({ id: null, age: inputs.currentAge + 5, ...ex })}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 text-xs rounded-lg transition-colors">
            + {ex.label}
          </button>
        ))}
      </div>

      {editing && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="text-gray-800 font-medium text-sm">{editing.id ? 'Edit' : 'New'} Income Event</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-gray-500 text-xs">Label</label>
              <input type="text" value={editing.label}
                onChange={e => setEditing({ ...editing, label: e.target.value })}
                placeholder="e.g. RSU Vest, Inheritance"
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-500 text-xs">Age when received</label>
              <input type="number" value={editing.age} min={inputs.currentAge} max={90}
                onChange={e => setEditing({ ...editing, age: Number(e.target.value) })}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-500 text-xs">Gross Amount ($)</label>
              <input type="number" value={editing.amount} min={0} step={5000}
                onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-500 text-xs">Tax Treatment</label>
              <select value={editing.taxable ? 'taxable' : 'tax-free'}
                onChange={e => setEditing({ ...editing, taxable: e.target.value === 'taxable' })}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500">
                <option value="taxable">Taxable (bonus, RSU, salary)</option>
                <option value="tax-free">Tax-free (inheritance, gift, insurance)</option>
              </select>
            </div>
          </div>
          {editing.amount > 0 && (
            <div className="text-emerald-600 text-xs">
              After-tax: {fmtCurrency(editing.taxable
                ? editing.amount * (1 - inputs.effectiveTaxRate - inputs.stateTaxRate)
                : editing.amount)}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">Save</button>
            <button onClick={cancel} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {inputs.incomeEvents.length === 0 && !editing && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No income events. Add bonuses, RSU vests, inheritances, or any one-time income.
        </div>
      )}

      <div className="space-y-3">
        {inputs.incomeEvents.map(e => (
          <EventCard key={e.id} event={e} onEdit={() => startEdit(e)} onDelete={() => del(e.id)} />
        ))}
      </div>
    </div>
  )
}
