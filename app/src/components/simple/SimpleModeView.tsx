import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { fmtCurrency } from '../../utils/formatters'
import { lazy, Suspense } from 'react'
const NetWorthChart = lazy(() => import('../charts/NetWorthChart').then(m => ({ default: m.NetWorthChart })))

const LIFESTYLE_OPTIONS = [
  {
    id: 'necessities' as const,
    label: 'Only paying for the necessities',
    desc: 'Rent, groceries, utilities, basic transport — nothing extra',
    pct: '50% of salary',
    color: 'border-sky-500 bg-sky-500/10 text-sky-300',
    inactive: 'border-slate-600 hover:border-slate-500 text-slate-400',
  },
  {
    id: 'comfortable' as const,
    label: 'Living comfortably',
    desc: 'Necessities plus dining out, holidays, hobbies, and some luxuries',
    pct: '65% of salary',
    color: 'border-teal-500 bg-teal-500/10 text-teal-300',
    inactive: 'border-slate-600 hover:border-slate-500 text-slate-400',
  },
  {
    id: 'lavish' as const,
    label: 'Living lavishly',
    desc: 'Premium lifestyle — luxury travel, fine dining, high-end everything',
    pct: '80% of salary',
    color: 'border-violet-500 bg-violet-500/10 text-violet-300',
    inactive: 'border-slate-600 hover:border-slate-500 text-slate-400',
  },
]

function NumberInput({ label, value, onChange, prefix = '', hint }: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  hint?: string
}) {
  const [raw, setRaw] = useState(String(value))
  const [focused, setFocused] = useState(false)

  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>
        )}
        <input
          type="text"
          value={focused ? raw : (prefix ? Number(value).toLocaleString() : String(value))}
          onFocus={() => { setFocused(true); setRaw(String(value)) }}
          onBlur={() => {
            setFocused(false)
            const n = parseFloat(raw.replace(/,/g, ''))
            if (!isNaN(n) && n > 0) onChange(n)
          }}
          onChange={e => setRaw(e.target.value)}
          className={`w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-lg font-mono-nums focus:outline-none focus:border-teal-500 transition-colors ${prefix ? 'pl-7' : ''}`}
        />
      </div>
      {hint && <div className="text-slate-500 text-xs">{hint}</div>}
    </div>
  )
}

function AgeSlider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-slate-300 text-sm font-medium">{label}</label>
        <span className="text-teal-400 font-mono-nums font-semibold">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-teal-500"
      />
      <div className="flex justify-between text-slate-600 text-xs">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

export function SimpleModeView() {
  const { simpleModeInputs, setSimpleModeInputs, summary, switchToAdvanced } = useStore()
  const { currentAge, retirementAge, salary, totalSavings, lifestyle } = simpleModeInputs

  const yearsToRetirement = retirementAge - currentAge
  const retirementNW = summary.retirementNetWorth
  const monthlyIncome = (retirementNW * 0.04) / 12
  const isOnTrack = retirementNW >= salary * 15  // rough 15x salary benchmark

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">

      {/* Inputs */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6">
        <h2 className="text-slate-100 font-semibold text-lg">Your Situation</h2>

        <div className="grid grid-cols-2 gap-5">
          <AgeSlider label="Current Age" value={currentAge} min={18} max={70}
            onChange={v => setSimpleModeInputs({ currentAge: v })} />
          <AgeSlider label="Retirement Age" value={retirementAge} min={45} max={80}
            onChange={v => setSimpleModeInputs({ retirementAge: v })} />
        </div>

        <NumberInput label="Annual Gross Salary" value={salary} prefix="$"
          onChange={v => setSimpleModeInputs({ salary: v })}
          hint="Your total yearly income before taxes" />

        <NumberInput label="Total Savings (all accounts combined)" value={totalSavings} prefix="$"
          onChange={v => setSimpleModeInputs({ totalSavings: v })}
          hint="Checking, savings, 401(k), investments — add it all up" />

        {/* Lifestyle selector */}
        <div className="space-y-3">
          <label className="text-slate-300 text-sm font-medium">Your Lifestyle</label>
          <div className="space-y-2">
            {LIFESTYLE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSimpleModeInputs({ lifestyle: opt.id })}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  lifestyle === opt.id ? opt.color : opt.inactive
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
                <div className="text-xs mt-1 font-mono-nums opacity-60">{opt.pct} → {fmtCurrency(Math.round(salary * (opt.id === 'necessities' ? 0.50 : opt.id === 'comfortable' ? 0.65 : 0.80)), true)}/yr</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 col-span-2 sm:col-span-1">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Nest Egg at Retirement</div>
          <div className="text-teal-400 font-mono-nums text-3xl font-bold">{fmtCurrency(retirementNW, true)}</div>
          <div className="text-slate-500 text-xs mt-1">At age {retirementAge} · in {yearsToRetirement} years</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Monthly Retirement Income</div>
          <div className="text-emerald-400 font-mono-nums text-2xl font-bold">{fmtCurrency(monthlyIncome, true)}</div>
          <div className="text-slate-500 text-xs mt-1">Based on 4% safe withdrawal</div>
        </div>

        <div className={`bg-slate-800 border rounded-2xl p-5 ${isOnTrack ? 'border-emerald-700' : 'border-amber-700'}`}>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">On Track?</div>
          <div className={`text-2xl font-bold ${isOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isOnTrack ? '✓ Yes' : '⚡ Almost'}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {isOnTrack ? 'You\'re heading for a comfortable retirement' : 'Small adjustments could make a big difference'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <Suspense fallback={<div className="h-80 bg-slate-800 border border-slate-700 rounded-xl animate-pulse" />}>
        <NetWorthChart />
      </Suspense>

      {/* Switch to Advanced CTA */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center space-y-3">
        <div className="text-slate-300 font-medium">Want a more accurate projection?</div>
        <div className="text-slate-500 text-sm">Advanced mode lets you add your 401(k), investment accounts, debts, milestones, and run Monte Carlo simulations.</div>
        <button
          onClick={switchToAdvanced}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Switch to Advanced Mode →
        </button>
      </div>
    </div>
  )
}
