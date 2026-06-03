import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { Debt } from '../../engine/types'
import { fmtCurrency } from '../../utils/formatters'
import { nanoid } from '../../utils/nanoid'

const DEBT_TYPES = ['mortgage', 'student_loan', 'car', 'other'] as const

interface EditState {
  id: string | null
  label: string
  type: Debt['type']
  balance: number
  annualPayment: number
  payoffAge: number
}

function DebtCard({ debt, onEdit, onDelete }: { debt: Debt; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-slate-200 text-sm font-medium">{debt.label}</div>
        <div className="text-slate-400 text-xs mt-0.5 capitalize">{debt.type.replace('_', ' ')} · Payoff age {debt.payoffAge}</div>
        <div className="flex gap-4 mt-1.5 text-xs">
          <span className="text-slate-400">Balance: <span className="font-mono-nums text-slate-300">{fmtCurrency(debt.balance)}</span></span>
          <span className="text-slate-400">Annual payment: <span className="font-mono-nums text-slate-300">{fmtCurrency(debt.annualPayment)}</span></span>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-600 rounded text-xs">✏</button>
        <button onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded text-xs">✕</button>
      </div>
    </div>
  )
}

export function DebtManager() {
  const { inputs, setInputs } = useStore()
  const [editing, setEditing] = useState<EditState | null>(null)

  const startNew = () => setEditing({
    id: null, label: '', type: 'mortgage',
    balance: 200000, annualPayment: 18000, payoffAge: inputs.currentAge + 30
  })
  const startEdit = (d: Debt) => setEditing({ id: d.id, label: d.label, type: d.type, balance: d.balance, annualPayment: d.annualPayment, payoffAge: d.payoffAge })
  const cancel = () => setEditing(null)

  const save = () => {
    if (!editing) return
    const updated = editing.id
      ? inputs.debts.map(d => d.id === editing.id ? { ...editing, id: d.id } : d)
      : [...inputs.debts, { ...editing, id: nanoid() }]
    setInputs({ debts: updated })
    setEditing(null)
  }

  const del = (id: string) => setInputs({ debts: inputs.debts.filter(d => d.id !== id) })

  const totalAnnualDebt = inputs.debts
    .filter(d => inputs.currentAge < d.payoffAge)
    .reduce((s, d) => s + d.annualPayment, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {totalAnnualDebt > 0 && (
          <div className="text-slate-400 text-sm">
            Current annual debt payments: <span className="font-mono-nums text-orange-400">{fmtCurrency(totalAnnualDebt)}</span>
          </div>
        )}
        <button onClick={startNew}
          className="ml-auto px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors">
          + Add Debt
        </button>
      </div>

      {editing && (
        <div className="bg-slate-800 border border-teal-700 rounded-xl p-5 space-y-4">
          <h4 className="text-slate-200 font-medium text-sm">{editing.id ? 'Edit' : 'New'} Debt</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Label</label>
              <input type="text" value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Type</label>
              <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as Debt['type'] })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500">
                {DEBT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Current Balance</label>
              <input type="number" value={editing.balance} min={0} step={1000}
                onChange={e => setEditing({ ...editing, balance: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Annual Payment</label>
              <input type="number" value={editing.annualPayment} min={0} step={500}
                onChange={e => setEditing({ ...editing, annualPayment: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Payoff Age</label>
              <input type="number" value={editing.payoffAge} min={inputs.currentAge} max={90}
                onChange={e => setEditing({ ...editing, payoffAge: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg">Save</button>
            <button onClick={cancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {inputs.debts.length === 0 && !editing && (
        <div className="text-center py-10 text-slate-500 text-sm">No debts added. Add a mortgage, student loan, etc.</div>
      )}

      <div className="space-y-3">
        {inputs.debts.map(d => (
          <DebtCard key={d.id} debt={d} onEdit={() => startEdit(d)} onDelete={() => del(d.id)} />
        ))}
      </div>
    </div>
  )
}
