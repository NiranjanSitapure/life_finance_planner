import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { SliderInput } from './SliderInput'
import { fmtCurrency, fmtPct } from '../../utils/formatters'

function Section({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 text-left text-slate-200 font-medium hover:bg-slate-750 transition-colors"
      >
        {title}
        <span className="text-slate-500 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5 space-y-5 border-t border-slate-700 pt-4">{children}</div>}
    </div>
  )
}

export function IntermediateParameterForm() {
  const { inputs, setInputs, summary } = useStore()

  return (
    <div className="space-y-4">
      <Section title="Personal">
        <SliderInput label="Current Age" value={inputs.currentAge} min={18} max={70} step={1}
          format={v => String(Math.round(v))} onChange={v => setInputs({ currentAge: Math.round(v) })}
          tooltip="Your age today. This sets the starting point of the entire projection." />
        <SliderInput label="Retirement Age" value={inputs.retirementAge} min={45} max={80} step={1}
          format={v => String(Math.round(v))} onChange={v => setInputs({ retirementAge: Math.round(v) })}
          tooltip="The age you plan to stop working. Every year earlier you retire means more years your portfolio must support you." />
      </Section>

      <Section title="Income">
        <SliderInput label="Annual Gross Salary" value={inputs.salary} min={30000} max={1000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ salary: v })}
          tooltip="Your total annual salary before taxes. If you have multiple jobs, add them together." />
        <SliderInput label="Salary Growth Rate" value={inputs.salaryGrowthRate} min={0} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ salaryGrowthRate: v })}
          tooltip="The average annual raise you expect. 5–7% is typical for mid-career professionals." />
        <SliderInput label="Spouse / Partner Salary" value={inputs.spouseSalary} min={0} max={500000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ spouseSalary: v })}
          tooltip="Your partner's annual gross income. Leave at $0 if not applicable." />
      </Section>

      <Section title="Account Balances">
        <SliderInput label="Stocks / Brokerage" value={inputs.stocks} min={0} max={2000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ stocks: v })}
          tooltip="Investments in a regular brokerage account. Not tax-sheltered — gains are taxed when sold." />
        <SliderInput label="Cash / HYSA" value={inputs.cash} min={0} max={500000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ cash: v })}
          tooltip="Money in checking, savings, or high-yield savings accounts." />
        <SliderInput label="401(k)" value={inputs.k401} min={0} max={2000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ k401: v })}
          tooltip="Employer-sponsored retirement account. Contributions are pre-tax but withdrawals are taxed." />
        <SliderInput label="Roth IRA" value={inputs.rothIRA} min={0} max={500000} step={1000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ rothIRA: v })}
          tooltip="Retirement account funded with after-tax dollars. Grows tax-free and withdrawals are also tax-free." />
      </Section>

      <Section title="Contributions">
        <SliderInput label="Annual 401(k) Contribution" value={inputs.k401Annual} min={0} max={69000} step={500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ k401Annual: v })}
          tooltip="How much you contribute to your 401(k) per year. IRS limit is $23,000 in 2024." />
        <SliderInput label="Employer Match %" value={inputs.employerMatchPct} min={0} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ employerMatchPct: v })}
          tooltip="The % of your salary your employer contributes to your 401(k) when you contribute. Free money — always maximize it." />
        <SliderInput label="Employer Match Cap" value={inputs.employerMatchCap} min={0} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ employerMatchCap: v })}
          tooltip="The max % of salary that qualifies for the employer match. Contribute at least this much to get the full match." />
        <SliderInput label="Annual Roth IRA Contribution" value={inputs.iraAnnual} min={0} max={7000} step={500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ iraAnnual: v })}
          warning={summary.rothPhaseOutWarning ? 'Income exceeds phase-out limit' : undefined}
          tooltip="How much you put into your Roth IRA per year. Limit is $7,000 in 2024." />
      </Section>

      <Section title="Returns & Inflation" defaultOpen={false}>
        <SliderInput label="Investment Return Rate" value={inputs.stockReturn} min={0.01} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ stockReturn: v, k401Return: v })}
          tooltip="Expected average annual return on your investments. The S&P 500 has averaged ~10% historically. 8% is a common conservative estimate." />
        <SliderInput label="Cash / HYSA Return" value={inputs.cashReturn} min={0} max={0.08} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ cashReturn: v })}
          tooltip="Interest rate on your cash savings. High-yield savings accounts currently offer 4–5%." />
        <SliderInput label="Inflation Rate" value={inputs.inflation} min={0.01} max={0.08} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ inflation: v })}
          tooltip="The annual rate at which prices rise. The Fed targets 2–3%. This erodes your purchasing power over time." />
      </Section>

      <Section title="Tax & Expenses" defaultOpen={false}>
        <SliderInput label="Effective Tax Rate" value={inputs.effectiveTaxRate} min={0.05} max={0.50} step={0.01}
          format={v => fmtPct(v)} onChange={v => setInputs({ effectiveTaxRate: v })}
          tooltip="Your actual tax rate after all deductions. Find it on last year's tax return: Total Tax ÷ Gross Income." />
        <SliderInput label="Base Annual Living Expenses" value={inputs.baseAnnualExpenses} min={20000} max={300000} step={2500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ baseAnnualExpenses: v })}
          tooltip="Your fixed annual spending — rent, groceries, utilities, insurance. Grows with inflation each year." />
        <SliderInput label="Retirement Spending (% of pre-retirement)" value={inputs.retirementSpendingEarly} min={0.40} max={1.10} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ retirementSpendingEarly: v, retirementSpendingMid: Math.max(0.40, v - 0.15), retirementSpendingLate: Math.max(0.50, v - 0.05) })}
          tooltip="What % of your current spending you'll need in retirement. 70–80% is a common estimate — lower mortgage, no commuting, but more leisure." />
      </Section>

      <Section title="Social Security" defaultOpen={false}>
        <div className="flex items-center justify-between">
          <label className="text-slate-300 text-sm">Include Social Security</label>
          <button
            onClick={() => setInputs({ socialSecurityEnabled: !inputs.socialSecurityEnabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${inputs.socialSecurityEnabled ? 'bg-teal-600' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${inputs.socialSecurityEnabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {inputs.socialSecurityEnabled && (
          <SliderInput label="SS Claiming Age" value={inputs.ssClaimingAge} min={62} max={70} step={1}
            format={v => String(Math.round(v))} onChange={v => setInputs({ ssClaimingAge: Math.round(v) })}
            tooltip="When you start collecting Social Security. Delaying past 67 increases your benefit by 8% per year." />
        )}
      </Section>
    </div>
  )
}
