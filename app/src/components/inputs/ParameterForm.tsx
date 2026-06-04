import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import { SliderInput } from './SliderInput'
import { fmtCurrency, fmtPct } from '../../utils/formatters'
import { InfoTooltip } from '../ui/InfoTooltip'

function Section({ title, children, defaultOpen = true, tooltip }: { title: string; children: React.ReactNode; defaultOpen?: boolean; tooltip?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 text-left text-gray-800 font-medium hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {title}
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5 space-y-5 border-t border-gray-200 pt-4">{children}</div>}
    </div>
  )
}

export function ParameterForm() {
  const { inputs, setInputs, resetInputs, saveScenario, summary } = useStore()
  const [scenarioName, setScenarioName] = useState('')

  const handleSave = () => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName.trim())
      setScenarioName('')
    }
  }

  return (
    <div className="space-y-4">
      {/* Save scenario */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Scenario name..."
          value={scenarioName}
          onChange={e => setScenarioName(e.target.value)}
          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          Save Scenario
        </button>
        <button
          onClick={resetInputs}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>

      <Section title="Personal">
        <SliderInput label="Current Age" value={inputs.currentAge} min={18} max={70} step={1}
          format={v => String(Math.round(v))} onChange={v => setInputs({ currentAge: Math.round(v) })}
          tooltip="Your age today. This sets the starting point of the entire projection." />
        <SliderInput label="Retirement Age" value={inputs.retirementAge} min={45} max={80} step={1}
          format={v => String(Math.round(v))} onChange={v => setInputs({ retirementAge: Math.round(v) })}
          tooltip="The age you plan to stop working. Every year earlier you retire means more years your portfolio must support you." />
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-gray-700 text-sm">Filing Status</label>
            <InfoTooltip content="Affects your Roth IRA income limits. Married filing jointly has higher phase-out thresholds ($230K vs $146K for single)." />
          </div>
          <select value={inputs.filingStatus}
            onChange={e => setInputs({ filingStatus: e.target.value as 'single' | 'married' })}
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500">
            <option value="single">Single</option>
            <option value="married">Married / MFJ</option>
          </select>
        </div>
      </Section>

      <Section title="Income">
        <SliderInput label="Current Gross Salary" value={inputs.salary} min={30000} max={1000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ salary: v })}
          tooltip="Your total annual salary before taxes and deductions. If you have multiple jobs, add them together." />
        <SliderInput label="Salary Growth Rate" value={inputs.salaryGrowthRate} min={0} max={0.20} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ salaryGrowthRate: v })}
          tooltip="The average annual raise you expect. 5-7% is typical for mid-career professionals. This compounds significantly over decades." />
        <SliderInput label="Spouse / Partner Salary" value={inputs.spouseSalary} min={0} max={500000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ spouseSalary: v })}
          tooltip="Your partner's annual gross income. Leave at $0 if not applicable." />
        <SliderInput label="Spouse Salary Growth Rate" value={inputs.spouseSalaryGrowthRate} min={0} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ spouseSalaryGrowthRate: v })}
          tooltip="Expected annual raise rate for your partner's income." />
        <SliderInput label="Side Income (annual)" value={inputs.sideIncomeAmount} min={0} max={200000} step={1000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ sideIncomeAmount: v })}
          tooltip="Freelance, consulting, rental, or any income outside your main job." />
        <div className="grid grid-cols-2 gap-3">
          <SliderInput label="Side Income Start Age" value={inputs.sideIncomeStartAge} min={18} max={70} step={1}
            format={v => String(Math.round(v))} onChange={v => setInputs({ sideIncomeStartAge: Math.round(v) })}
            tooltip="The age range during which your side income is active." />
          <SliderInput label="Side Income End Age" value={inputs.sideIncomeEndAge} min={18} max={80} step={1}
            format={v => String(Math.round(v))} onChange={v => setInputs({ sideIncomeEndAge: Math.round(v) })}
            tooltip="The age range during which your side income is active." />
        </div>
      </Section>

      <Section title="Starting Balances">
        <SliderInput label="Taxable Stocks / Brokerage" value={inputs.stocks} min={0} max={2000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ stocks: v })}
          tooltip="Investments in a regular brokerage account (e.g. Fidelity, Schwab, Robinhood). Not tax-sheltered — gains are taxed when sold." />
        <SliderInput label="Bonds" value={inputs.bonds} min={0} max={1000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ bonds: v })}
          tooltip="Fixed-income investments (government or corporate bonds). Lower return than stocks but less volatile. Good for stability near retirement." />
        <SliderInput label="Cash / HYSA" value={inputs.cash} min={0} max={1000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ cash: v })}
          tooltip="Money in checking, savings, or high-yield savings accounts. Safe but lower returns. Good for short-term needs and emergencies." />
        <SliderInput label="Roth IRA" value={inputs.rothIRA} min={0} max={500000} step={1000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ rothIRA: v })}
          tooltip="A retirement account funded with after-tax dollars. Grows tax-free and withdrawals in retirement are also tax-free. Contribution limit: $7,000/yr (2024)." />
        <SliderInput label="401(k)" value={inputs.k401} min={0} max={2000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ k401: v })}
          tooltip="An employer-sponsored retirement account. Contributions are pre-tax (reduces your taxable income now), but withdrawals in retirement are taxed. Contribution limit: $23,000/yr (2024)." />
        <SliderInput label="HSA" value={inputs.hsa} min={0} max={200000} step={1000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ hsa: v })}
          tooltip="Health Savings Account — triple tax advantage: contributions are pre-tax, growth is tax-free, and withdrawals for medical expenses are tax-free. Can also be used as a stealth retirement account after age 65." />
      </Section>

      <Section title="Contributions">
        <SliderInput label="Annual 401(k) Employee Contribution" value={inputs.k401Annual} min={0} max={69000} step={500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ k401Annual: v })}
          tooltip="How much you contribute to your 401(k) each year. The IRS limit is $23,000 in 2024 ($30,500 if age 50+). Maxing this out is one of the highest-impact financial moves you can make." />
        <SliderInput label="Employer Match %" value={inputs.employerMatchPct} min={0} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ employerMatchPct: v })}
          tooltip="The percentage of your salary your employer contributes to your 401(k) when you contribute. A 4% match on a $100K salary = $4,000 of free money per year." />
        <SliderInput label="Employer Match Cap (% of salary)" value={inputs.employerMatchCap} min={0} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ employerMatchCap: v })}
          tooltip="The maximum % of your salary that qualifies for the employer match. To get the full match, you must contribute at least this % yourself." />
        <SliderInput label="Annual Roth IRA Contribution" value={inputs.iraAnnual} min={0} max={7000} step={500}
          format={v => fmtCurrency(v)}
          onChange={v => setInputs({ iraAnnual: v })}
          warning={summary.rothPhaseOutWarning && !inputs.backdoorRoth ? 'Income exceeds phase-out limit' : undefined}
          tooltip="How much you put into your Roth IRA each year. The limit is $7,000 in 2024. If your income is too high, you may need to use the Backdoor Roth strategy."
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label className="text-gray-700 text-sm">Enable Backdoor Roth</label>
            <InfoTooltip content="A legal strategy for high earners who exceed the Roth IRA income limits. You contribute to a Traditional IRA (no income limit) and immediately convert it to Roth. Enables Roth benefits regardless of income." />
          </div>
          <button
            onClick={() => setInputs({ backdoorRoth: !inputs.backdoorRoth })}
            className={`relative w-11 h-6 rounded-full transition-colors ${inputs.backdoorRoth ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${inputs.backdoorRoth ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <SliderInput label="Annual HSA Contribution" value={inputs.hsaAnnual} min={0} max={8300} step={100}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ hsaAnnual: v })}
          tooltip="How much you contribute to your HSA per year. 2024 limit: $4,150 (individual) or $8,300 (family). Invested HSA funds grow tax-free." />
      </Section>

      <Section title="Economic Assumptions" defaultOpen={false}>
        <SliderInput label="Stock / Brokerage Return" value={inputs.stockReturn} min={0.01} max={0.20} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ stockReturn: v })}
          tooltip="Expected average annual return from stock investments. The S&P 500 has averaged ~10% historically (7% inflation-adjusted). 8% is a common conservative estimate." />
        <SliderInput label="Bond Return" value={inputs.bondReturn} min={0.01} max={0.12} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ bondReturn: v })}
          tooltip="Expected annual return from bonds. Typically 3-5% for a diversified bond portfolio. Lower risk than stocks but lower long-term returns." />
        <SliderInput label="Cash / HYSA Return" value={inputs.cashReturn} min={0.00} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ cashReturn: v })}
          tooltip="Interest rate on your cash savings. High-yield savings accounts currently offer 4-5%, but this fluctuates with Fed rates." />
        <SliderInput label="401(k) Return" value={inputs.k401Return} min={0.01} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ k401Return: v })}
          tooltip="Expected return inside your 401(k). Usually matches your stock/bond blend. Defaults to the same as your stock return if your 401(k) is fully in equities." />
        <SliderInput label="HSA Return" value={inputs.hsaReturn} min={0.01} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ hsaReturn: v })}
          tooltip="Expected return on invested HSA funds. Many providers let you invest HSA money in index funds once you exceed a cash threshold." />
        <SliderInput label="Inflation Rate" value={inputs.inflation} min={0.005} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ inflation: v })}
          tooltip="The annual rate at which prices rise. The Fed targets 2-3%. This erodes your purchasing power over time — a dollar today buys less in 30 years." />
      </Section>

      <Section title="Tax Assumptions" defaultOpen={false}>
        <SliderInput label="Federal Effective Tax Rate" value={inputs.effectiveTaxRate} min={0.05} max={0.50} step={0.01}
          format={v => fmtPct(v)} onChange={v => setInputs({ effectiveTaxRate: v })}
          tooltip="Your actual tax rate after deductions, credits, and brackets — not your marginal rate. Most people pay 20-30% effectively. You can find this on last year's tax return: Total Tax ÷ Gross Income." />
        <SliderInput label="Long-term Capital Gains Rate" value={inputs.capitalGainsTaxRate} min={0} max={0.20} step={0.01}
          format={v => fmtPct(v)} onChange={v => setInputs({ capitalGainsTaxRate: v })}
          tooltip="Tax rate on profits from selling investments held over 1 year. 0% (income < $47K), 15% (most people), or 20% (income > $518K) for single filers in 2024." />
        <SliderInput label="State Income Tax Rate" value={inputs.stateTaxRate} min={0} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ stateTaxRate: v })}
          tooltip="Your state's income tax rate. Ranges from 0% (Texas, Florida) to 13.3% (California). Check your state's tax rate." />
      </Section>

      <Section title="Expenses" defaultOpen={false}>
        <SliderInput label="Base Annual Living Expenses" value={inputs.baseAnnualExpenses} min={20000} max={300000} step={2500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ baseAnnualExpenses: v })}
          hint="Fixed expenses growing with CPI (rent, food, utilities, insurance)"
          tooltip="Your fixed annual spending that doesn't scale with income — rent/mortgage, groceries, utilities, insurance, subscriptions. This grows with inflation each year." />
        <SliderInput label="Discretionary Scale (% of income above $100K)" value={inputs.discretionaryPct} min={0} max={0.30} step={0.01}
          format={v => fmtPct(v)} onChange={v => setInputs({ discretionaryPct: v })}
          tooltip="The extra lifestyle spending you add for every dollar you earn above $100K. At 10%, earning $200K means $10K more in discretionary spending vs earning $100K." />
        <div className="text-gray-500 text-xs font-medium pt-1">Retirement Spending — Smile Curve</div>
        <SliderInput label="Active Phase (age retire → +10 yrs)" value={inputs.retirementSpendingEarly} min={0.40} max={1.20} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ retirementSpendingEarly: v })}
          hint="Travel, hobbies — typically highest spending"
          tooltip="Your spending in the first 10 years of retirement. Typically the highest — you're healthy, active, and finally have time to travel and enjoy life." />
        <SliderInput label="Quiet Phase (+10 → +20 yrs)" value={inputs.retirementSpendingMid} min={0.30} max={1.0} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ retirementSpendingMid: v })}
          hint="Slower pace, lower discretionary spend"
          tooltip="Spending in years 10-20 of retirement. Usually dips — less travel, fewer activities. The 'go-go' years are over." />
        <SliderInput label="Late Phase (+20 yrs onward)" value={inputs.retirementSpendingLate} min={0.40} max={1.20} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ retirementSpendingLate: v })}
          hint="Healthcare dominates — often rises again"
          tooltip="Spending in the final phase of retirement. Often rises again due to healthcare costs, assisted living, and medical needs." />
        <SliderInput label="Healthcare (pre-Medicare, annual)" value={inputs.healthcarePreMedicare} min={0} max={40000} step={1000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ healthcarePreMedicare: v })}
          hint="ACA marketplace cost if retiring before 65"
          tooltip="Annual healthcare insurance cost if you retire before age 65, before Medicare kicks in. ACA marketplace plans for a 60-year-old typically cost $15,000-25,000/year." />
        <SliderInput label="Healthcare (post-Medicare, annual)" value={inputs.healthcarePostMedicare} min={0} max={20000} step={500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ healthcarePostMedicare: v })}
          hint="Medicare premiums + supplemental coverage"
          tooltip="Annual cost after Medicare starts at 65. Includes Medicare Part B premiums (~$2,100/yr), Part D drug coverage, and supplemental Medigap insurance." />
      </Section>

      <Section title="Asset Allocation Glide Path" defaultOpen={false}>
        <SliderInput label="Stock Allocation Now" value={inputs.stockAllocNow} min={0.10} max={1.0} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ stockAllocNow: v })}
          tooltip="What percentage of your investable assets (stocks + bonds) should be in stocks right now. Common rule of thumb: 110 minus your age. At 30, that's 80% stocks." />
        <SliderInput label="Stock Allocation at Retirement" value={inputs.stockAllocAtRetirement} min={0.10} max={0.90} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ stockAllocAtRetirement: v })}
          tooltip="Target stock % when you reach retirement. Lower than today to reduce volatility when you're drawing down. 50-60% stocks in retirement is common." />
      </Section>

      <Section title="Social Security" defaultOpen={false}>
        <div className="flex items-center justify-between">
          <label className="text-gray-700 text-sm">Enable Social Security</label>
          <button
            onClick={() => setInputs({ socialSecurityEnabled: !inputs.socialSecurityEnabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${inputs.socialSecurityEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${inputs.socialSecurityEnabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {inputs.socialSecurityEnabled && (
          <>
            <SliderInput label="SS Claiming Age" value={inputs.ssClaimingAge} min={62} max={70} step={1}
              format={v => String(Math.round(v))} onChange={v => setInputs({ ssClaimingAge: Math.round(v) })}
              tooltip="When you start collecting Social Security. You can claim as early as 62 (reduced benefit) or as late as 70 (maximum benefit — 8% more per year of delay past full retirement age of 67)." />
            <SliderInput label="Benefit (% of final salary)" value={inputs.ssBenefitPct} min={0.15} max={0.60} step={0.01}
              format={v => fmtPct(v)} onChange={v => setInputs({ ssBenefitPct: v })}
              tooltip="Approximation of your Social Security benefit as a % of your final salary. The SSA replaces roughly 25-40% of pre-retirement income for average earners." />
          </>
        )}
      </Section>

      <Section title="Bridge / Part-Time Income" defaultOpen={false}>
        <SliderInput label="Annual Bridge Income" value={inputs.bridgeIncomeAmount} min={0} max={150000} step={2500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ bridgeIncomeAmount: v })}
          hint="Part-time or consulting income in early retirement (post-tax reduced rate applied)"
          tooltip="Part-time work, consulting, or freelance income during early retirement. Even $30K/yr for 10 years dramatically reduces portfolio drawdown and gives your investments more time to grow." />
        {inputs.bridgeIncomeAmount > 0 && (
          <>
            <SliderInput label="Bridge Income Start Age" value={inputs.bridgeIncomeStartAge} min={45} max={75} step={1}
              format={v => String(Math.round(v))} onChange={v => setInputs({ bridgeIncomeStartAge: Math.round(v) })}
              tooltip="The age range you plan to earn bridge income." />
            <SliderInput label="Bridge Income End Age" value={inputs.bridgeIncomeEndAge} min={50} max={80} step={1}
              format={v => String(Math.round(v))} onChange={v => setInputs({ bridgeIncomeEndAge: Math.round(v) })}
              tooltip="The age range you plan to earn bridge income." />
          </>
        )}
      </Section>

      <Section
        title="Required Minimum Distributions (RMDs)"
        defaultOpen={false}
        tooltip="Required Minimum Distribution: The IRS forces you to withdraw a minimum amount from traditional 401(k) and IRA accounts each year starting at age 73. These withdrawals are taxed as ordinary income. Ignoring RMDs results in a 25% penalty on the amount you should have withdrawn."
      >
        <div className="flex items-center justify-between">
          <div>
            <label className="text-gray-700 text-sm">Enable RMD Modeling</label>
            <div className="text-gray-400 text-xs mt-0.5">IRS forces 401(k) withdrawals starting at age 73</div>
          </div>
          <button
            onClick={() => setInputs({ rmdEnabled: !inputs.rmdEnabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${inputs.rmdEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${inputs.rmdEnabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {inputs.rmdEnabled && (
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            RMD = 401(k) balance ÷ IRS life expectancy factor. Withdrawals are taxed as ordinary income.
            Any surplus beyond spending needs is reinvested in taxable brokerage.
          </div>
        )}
      </Section>
    </div>
  )
}
