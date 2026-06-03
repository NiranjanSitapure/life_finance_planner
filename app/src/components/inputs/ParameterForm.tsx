import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import { SliderInput } from './SliderInput'
import { fmtCurrency, fmtPct } from '../../utils/formatters'

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
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
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
        />
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors"
        >
          Save Scenario
        </button>
        <button
          onClick={resetInputs}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>

      <Section title="Personal">
        <SliderInput label="Current Age" value={inputs.currentAge} min={18} max={70} step={1}
          format={v => String(Math.round(v))} onChange={v => setInputs({ currentAge: Math.round(v) })} />
        <SliderInput label="Retirement Age" value={inputs.retirementAge} min={45} max={80} step={1}
          format={v => String(Math.round(v))} onChange={v => setInputs({ retirementAge: Math.round(v) })} />
        <div className="space-y-1.5">
          <label className="text-slate-300 text-sm">Filing Status</label>
          <select value={inputs.filingStatus}
            onChange={e => setInputs({ filingStatus: e.target.value as 'single' | 'married' })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500">
            <option value="single">Single</option>
            <option value="married">Married / MFJ</option>
          </select>
        </div>
      </Section>

      <Section title="Income">
        <SliderInput label="Current Gross Salary" value={inputs.salary} min={30000} max={1000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ salary: v })} />
        <SliderInput label="Salary Growth Rate" value={inputs.salaryGrowthRate} min={0} max={0.20} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ salaryGrowthRate: v })} />
        <SliderInput label="Spouse / Partner Salary" value={inputs.spouseSalary} min={0} max={500000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ spouseSalary: v })} />
        <SliderInput label="Spouse Salary Growth Rate" value={inputs.spouseSalaryGrowthRate} min={0} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ spouseSalaryGrowthRate: v })} />
        <SliderInput label="Side Income (annual)" value={inputs.sideIncomeAmount} min={0} max={200000} step={1000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ sideIncomeAmount: v })} />
        <div className="grid grid-cols-2 gap-3">
          <SliderInput label="Side Income Start Age" value={inputs.sideIncomeStartAge} min={18} max={70} step={1}
            format={v => String(Math.round(v))} onChange={v => setInputs({ sideIncomeStartAge: Math.round(v) })} />
          <SliderInput label="Side Income End Age" value={inputs.sideIncomeEndAge} min={18} max={80} step={1}
            format={v => String(Math.round(v))} onChange={v => setInputs({ sideIncomeEndAge: Math.round(v) })} />
        </div>
      </Section>

      <Section title="Starting Balances">
        <SliderInput label="Taxable Stocks / Brokerage" value={inputs.stocks} min={0} max={2000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ stocks: v })} />
        <SliderInput label="Bonds" value={inputs.bonds} min={0} max={1000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ bonds: v })} />
        <SliderInput label="Cash / HYSA" value={inputs.cash} min={0} max={1000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ cash: v })} />
        <SliderInput label="Roth IRA" value={inputs.rothIRA} min={0} max={500000} step={1000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ rothIRA: v })} />
        <SliderInput label="401(k)" value={inputs.k401} min={0} max={2000000} step={5000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ k401: v })} />
        <SliderInput label="HSA" value={inputs.hsa} min={0} max={200000} step={1000}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ hsa: v })} />
      </Section>

      <Section title="Contributions">
        <SliderInput label="Annual 401(k) Employee Contribution" value={inputs.k401Annual} min={0} max={69000} step={500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ k401Annual: v })} />
        <SliderInput label="Employer Match %" value={inputs.employerMatchPct} min={0} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ employerMatchPct: v })} />
        <SliderInput label="Employer Match Cap (% of salary)" value={inputs.employerMatchCap} min={0} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ employerMatchCap: v })} />
        <SliderInput label="Annual Roth IRA Contribution" value={inputs.iraAnnual} min={0} max={7000} step={500}
          format={v => fmtCurrency(v)}
          onChange={v => setInputs({ iraAnnual: v })}
          warning={summary.rothPhaseOutWarning && !inputs.backdoorRoth ? 'Income exceeds phase-out limit' : undefined}
        />
        <div className="flex items-center justify-between">
          <label className="text-slate-300 text-sm">Enable Backdoor Roth</label>
          <button
            onClick={() => setInputs({ backdoorRoth: !inputs.backdoorRoth })}
            className={`relative w-11 h-6 rounded-full transition-colors ${inputs.backdoorRoth ? 'bg-teal-600' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${inputs.backdoorRoth ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <SliderInput label="Annual HSA Contribution" value={inputs.hsaAnnual} min={0} max={8300} step={100}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ hsaAnnual: v })} />
      </Section>

      <Section title="Economic Assumptions" defaultOpen={false}>
        <SliderInput label="Stock / Brokerage Return" value={inputs.stockReturn} min={0.01} max={0.20} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ stockReturn: v })} />
        <SliderInput label="Bond Return" value={inputs.bondReturn} min={0.01} max={0.12} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ bondReturn: v })} />
        <SliderInput label="Cash / HYSA Return" value={inputs.cashReturn} min={0.00} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ cashReturn: v })} />
        <SliderInput label="401(k) Return" value={inputs.k401Return} min={0.01} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ k401Return: v })} />
        <SliderInput label="HSA Return" value={inputs.hsaReturn} min={0.01} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ hsaReturn: v })} />
        <SliderInput label="Inflation Rate" value={inputs.inflation} min={0.005} max={0.10} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ inflation: v })} />
      </Section>

      <Section title="Tax Assumptions" defaultOpen={false}>
        <SliderInput label="Federal Effective Tax Rate" value={inputs.effectiveTaxRate} min={0.05} max={0.50} step={0.01}
          format={v => fmtPct(v)} onChange={v => setInputs({ effectiveTaxRate: v })} />
        <SliderInput label="Long-term Capital Gains Rate" value={inputs.capitalGainsTaxRate} min={0} max={0.20} step={0.01}
          format={v => fmtPct(v)} onChange={v => setInputs({ capitalGainsTaxRate: v })} />
        <SliderInput label="State Income Tax Rate" value={inputs.stateTaxRate} min={0} max={0.15} step={0.005}
          format={v => fmtPct(v)} onChange={v => setInputs({ stateTaxRate: v })} />
      </Section>

      <Section title="Expenses" defaultOpen={false}>
        <SliderInput label="Base Annual Living Expenses" value={inputs.baseAnnualExpenses} min={20000} max={300000} step={2500}
          format={v => fmtCurrency(v)} onChange={v => setInputs({ baseAnnualExpenses: v })}
          hint="Fixed expenses growing with CPI (rent, food, utilities, insurance)" />
        <SliderInput label="Discretionary Scale (% of income above $100K)" value={inputs.discretionaryPct} min={0} max={0.30} step={0.01}
          format={v => fmtPct(v)} onChange={v => setInputs({ discretionaryPct: v })} />
        <SliderInput label="Retirement Spending (% of pre-retirement)" value={inputs.retirementSpendingPct} min={0.40} max={1.0} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ retirementSpendingPct: v })} />
      </Section>

      <Section title="Asset Allocation Glide Path" defaultOpen={false}>
        <SliderInput label="Stock Allocation Now" value={inputs.stockAllocNow} min={0.10} max={1.0} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ stockAllocNow: v })} />
        <SliderInput label="Stock Allocation at Retirement" value={inputs.stockAllocAtRetirement} min={0.10} max={0.90} step={0.05}
          format={v => fmtPct(v)} onChange={v => setInputs({ stockAllocAtRetirement: v })} />
      </Section>

      <Section title="Social Security" defaultOpen={false}>
        <div className="flex items-center justify-between">
          <label className="text-slate-300 text-sm">Enable Social Security</label>
          <button
            onClick={() => setInputs({ socialSecurityEnabled: !inputs.socialSecurityEnabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${inputs.socialSecurityEnabled ? 'bg-teal-600' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${inputs.socialSecurityEnabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {inputs.socialSecurityEnabled && (
          <>
            <SliderInput label="SS Claiming Age" value={inputs.ssClaimingAge} min={62} max={70} step={1}
              format={v => String(Math.round(v))} onChange={v => setInputs({ ssClaimingAge: Math.round(v) })} />
            <SliderInput label="Benefit (% of final salary)" value={inputs.ssBenefitPct} min={0.15} max={0.60} step={0.01}
              format={v => fmtPct(v)} onChange={v => setInputs({ ssBenefitPct: v })} />
          </>
        )}
      </Section>
    </div>
  )
}
