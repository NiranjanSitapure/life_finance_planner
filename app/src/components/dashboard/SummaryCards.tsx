import { useStore } from '../../store/useStore'
import { fmtCurrency, fmtAge } from '../../utils/formatters'
import { InfoTooltip } from '../ui/InfoTooltip'

interface CardProps {
  title: string
  value: string
  sub?: string
  accent?: string
  badge?: { text: string; color: string }
  tooltip?: string
}

function Card({ title, value, sub, accent = 'text-indigo-600', badge, tooltip }: CardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-1.5 shadow-sm">
      <div className="text-gray-500 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
        {title}
        {tooltip && <InfoTooltip content={tooltip} position="bottom" />}
        {badge && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-normal ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className={`font-mono-nums text-2xl font-semibold ${accent}`}>{value}</div>
      {sub && <div className="text-gray-400 text-xs">{sub}</div>}
    </div>
  )
}

function FIREBar() {
  const { rows, summary } = useStore()
  const current = rows[0]?.netWorth ?? 0
  const pct = Math.min(100, (current / summary.fireNumber) * 100)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 col-span-full shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">
          FIRE Progress
        </div>
        <div className="text-gray-500 text-xs font-mono-nums">
          {fmtCurrency(current, true)} / {fmtCurrency(summary.fireNumber, true)}
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-gray-400 text-xs">{pct.toFixed(1)}% of FIRE target</span>
        {summary.fireAge && (
          <span className="text-indigo-600 text-xs">
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
        accent="text-indigo-600"
        tooltip="The total value of all your accounts (stocks, 401k, Roth IRA, cash, HSA, bonds) on the day you retire. This is your financial foundation for the rest of your life."
      />
      <Card
        title="Safe Annual Income (4%)"
        value={fmtCurrency(summary.safeWithdrawalIncome, true)}
        sub={`At age ${inputs.retirementAge}`}
        accent="text-emerald-600"
        tooltip="The amount you can safely withdraw each year in retirement without running out of money. Based on the '4% Rule' — a widely studied guideline that says withdrawing 4% of your portfolio annually has historically lasted 30+ years."
      />
      <Card
        title="FIRE Number"
        value={fmtCurrency(summary.fireNumber, true)}
        sub={summary.fireAge ? `Projected at ${fmtAge(summary.fireAge)}` : 'Not reached in projection'}
        accent="text-violet-600"
        tooltip="Financial Independence, Retire Early number — the portfolio size at which your investments generate enough passive income to cover all your expenses forever, based on the 4% rule. FIRE Number = Annual Expenses ÷ 0.04."
      />
      <Card
        title="First $1M Milestone"
        value={fmtAge(summary.firstMillionAge)}
        sub={summary.firstMillionAge ? `${summary.firstMillionAge - inputs.currentAge} years away` : ''}
        accent="text-amber-600"
        tooltip="The projected age when your total net worth first crosses $1,000,000. The first million is the hardest — compounding accelerates significantly after this point."
      />
      <Card
        title="Years to Retirement"
        value={`${summary.yearsToRetirement} yrs`}
        sub={`Retire at age ${inputs.retirementAge}`}
        accent="text-sky-600"
        tooltip="How many years until you reach your target retirement age. Each additional year of work has a double benefit: more contributions AND less time for the portfolio to support you."
      />
      <Card
        title="Employer Match (total)"
        value={fmtCurrency(summary.totalEmployerMatch, true)}
        sub="Lifetime 401(k) match received"
        accent="text-pink-600"
        tooltip="The total amount your employer will contribute to your 401(k) over your entire career. This is completely free money — always contribute at least enough to get the full match."
      />
      <Card
        title="Break-Even Age"
        value={fmtAge(summary.breakEvenAge)}
        sub="When portfolio returns cover all expenses"
        accent="text-cyan-600"
        tooltip="The age when your investment returns (4% of portfolio) first exceed your total annual expenses. Once you hit this point, your money is growing faster than you're spending it — true financial independence."
      />
      <Card
        title="RMD Tax (lifetime)"
        value={fmtCurrency(summary.totalRMDTaxPaid, true)}
        sub="Estimated tax on forced 401(k) withdrawals"
        accent="text-rose-600"
        tooltip="Total estimated income tax you'll pay on Required Minimum Distributions from your 401(k) starting at age 73. This is unavoidable — the IRS deferred these taxes when you contributed, and collects them in retirement."
      />
      <FIREBar />
    </div>
  )
}
