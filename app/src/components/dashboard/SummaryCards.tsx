import { useStore } from '../../store/useStore'
import { fmtCurrency, fmtAge } from '../../utils/formatters'

interface CardProps {
  title: string
  value: string
  sub?: string
  accent?: string
  badge?: { text: string; color: string }
}

function Card({ title, value, sub, accent = 'text-teal-400', badge }: CardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-1.5">
      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
        {title}
        {badge && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-normal ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className={`font-mono-nums text-2xl font-semibold ${accent}`}>{value}</div>
      {sub && <div className="text-slate-500 text-xs">{sub}</div>}
    </div>
  )
}

function FIREBar() {
  const { rows, summary } = useStore()
  const current = rows[0]?.netWorth ?? 0
  const pct = Math.min(100, (current / summary.fireNumber) * 100)
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 col-span-full">
      <div className="flex justify-between items-center mb-3">
        <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
          FIRE Progress
        </div>
        <div className="text-slate-400 text-xs font-mono-nums">
          {fmtCurrency(current, true)} / {fmtCurrency(summary.fireNumber, true)}
        </div>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-slate-500 text-xs">{pct.toFixed(1)}% of FIRE target</span>
        {summary.fireAge && (
          <span className="text-teal-400 text-xs">
            On track to FIRE at {fmtAge(summary.fireAge)}
          </span>
        )}
      </div>
    </div>
  )
}

export function SummaryCards() {
  const { summary, inputs } = useStore()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        title="Net Worth at Retirement"
        value={fmtCurrency(summary.retirementNetWorth, true)}
        sub={`Real: ${fmtCurrency(summary.retirementRealNetWorth, true)} (today's $)`}
        accent="text-teal-400"
      />
      <Card
        title="Safe Annual Income (4%)"
        value={fmtCurrency(summary.safeWithdrawalIncome, true)}
        sub={`At age ${inputs.retirementAge}`}
        accent="text-emerald-400"
      />
      <Card
        title="FIRE Number"
        value={fmtCurrency(summary.fireNumber, true)}
        sub={summary.fireAge ? `Projected at ${fmtAge(summary.fireAge)}` : 'Not reached in projection'}
        accent="text-violet-400"
      />
      <Card
        title="First $1M Milestone"
        value={fmtAge(summary.firstMillionAge)}
        sub={summary.firstMillionAge ? `${summary.firstMillionAge - inputs.currentAge} years away` : ''}
        accent="text-amber-400"
      />
      <Card
        title="Years to Retirement"
        value={`${summary.yearsToRetirement} yrs`}
        sub={`Retire at age ${inputs.retirementAge}`}
        accent="text-sky-400"
      />
      <Card
        title="Employer Match (total)"
        value={fmtCurrency(summary.totalEmployerMatch, true)}
        sub="Lifetime 401(k) match received"
        accent="text-pink-400"
      />
      <Card
        title="Break-Even Age"
        value={fmtAge(summary.breakEvenAge)}
        sub="When portfolio returns cover all expenses"
        accent="text-cyan-400"
      />
      <Card
        title="RMD Tax (lifetime)"
        value={fmtCurrency(summary.totalRMDTaxPaid, true)}
        sub="Estimated tax on forced 401(k) withdrawals"
        accent="text-red-400"
      />
      <FIREBar />
    </div>
  )
}
