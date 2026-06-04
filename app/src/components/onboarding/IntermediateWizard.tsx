import { useStore } from '../../store/useStore'
import { SliderInput } from '../inputs/SliderInput'
import { fmtCurrency, fmtPct } from '../../utils/formatters'

const STEPS = [
  { title: 'Your Situation',     icon: '🗓️', subtitle: 'When do you want to retire?' },
  { title: 'Your Income',        icon: '💼', subtitle: 'How much do you earn?' },
  { title: 'Your Savings',       icon: '🏦', subtitle: 'What have you saved so far?' },
  { title: 'Your Contributions', icon: '📈', subtitle: 'How much are you investing?' },
  { title: 'Your Expenses',      icon: '🏠', subtitle: 'What does life cost you?' },
  { title: "You're All Set!",    icon: '🎉', subtitle: null },
]

export function IntermediateWizard() {
  const {
    inputs, setInputs, summary,
    onboardingStep, dismissOnboarding, nextOnboardingStep, prevOnboardingStep,
    setActiveSection,
  } = useStore()

  const isFirst = onboardingStep === 0
  const isLast = onboardingStep === STEPS.length - 1
  const step = STEPS[onboardingStep] ?? STEPS[0]

  const retirementNW = summary.retirementNetWorth
  const monthlyIncome = (retirementNW * 0.04) / 12

  const handleNext = () => {
    if (isLast) setActiveSection('charts')
    nextOnboardingStep()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className={`bg-slate-800 border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] transition-all ${isLast ? 'border-teal-600' : 'border-slate-600'}`}>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-700 rounded-t-2xl overflow-hidden shrink-0">
          <div
            className={`h-full transition-all duration-500 ${isLast ? 'bg-emerald-500' : 'bg-teal-500'}`}
            style={{ width: `${((onboardingStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs">{onboardingStep + 1} of {STEPS.length}</span>
            <button
              onClick={dismissOnboarding}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors p-1 rounded-lg hover:bg-slate-700"
            >
              ✕ Skip
            </button>
          </div>

          {/* Dot progress */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => i < onboardingStep && useStore.setState({ onboardingStep: i })}
                className={`rounded-full transition-all duration-300 ${
                  i === onboardingStep
                    ? 'w-6 h-2 bg-teal-400'
                    : i < onboardingStep
                    ? 'w-2 h-2 bg-teal-700 hover:bg-teal-600 cursor-pointer'
                    : 'w-2 h-2 bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Header */}
          <div className="text-center space-y-1">
            <div className="text-4xl">{step.icon}</div>
            <h3 className={`text-xl font-semibold ${isLast ? 'text-emerald-400' : 'text-slate-100'}`}>
              {step.title}
            </h3>
            {step.subtitle && <p className="text-slate-400 text-sm">{step.subtitle}</p>}
          </div>

          {/* Step content */}
          <div className="space-y-4">
            {onboardingStep === 0 && (
              <>
                <SliderInput label="Current Age" value={inputs.currentAge} min={18} max={70} step={1}
                  format={v => String(Math.round(v))} onChange={v => setInputs({ currentAge: Math.round(v) })}
                  tooltip="Your age today. This sets the starting point of the entire projection." />
                <SliderInput label="Retirement Age" value={inputs.retirementAge} min={45} max={80} step={1}
                  format={v => String(Math.round(v))} onChange={v => setInputs({ retirementAge: Math.round(v) })}
                  tooltip="The age you plan to stop working. Every year earlier you retire means more years your portfolio must support you." />
              </>
            )}

            {onboardingStep === 1 && (
              <>
                <SliderInput label="Annual Gross Salary" value={inputs.salary} min={30000} max={1000000} step={5000}
                  format={v => fmtCurrency(v)} onChange={v => setInputs({ salary: v })}
                  tooltip="Your total annual salary before taxes. If you have multiple jobs, add them together." />
                <SliderInput label="Salary Growth Rate" value={inputs.salaryGrowthRate} min={0} max={0.15} step={0.005}
                  format={v => fmtPct(v)} onChange={v => setInputs({ salaryGrowthRate: v })}
                  tooltip="The average annual raise you expect. 5–7% is typical for mid-career professionals." />
                <SliderInput label="Spouse / Partner Salary" value={inputs.spouseSalary} min={0} max={500000} step={5000}
                  format={v => fmtCurrency(v)} onChange={v => setInputs({ spouseSalary: v })}
                  tooltip="Your partner's annual gross income. Leave at $0 if not applicable." />
              </>
            )}

            {onboardingStep === 2 && (
              <>
                <SliderInput label="Stocks / Brokerage" value={inputs.stocks} min={0} max={2000000} step={5000}
                  format={v => fmtCurrency(v)} onChange={v => setInputs({ stocks: v })}
                  tooltip="Investments in a regular brokerage account." />
                <SliderInput label="Cash / HYSA" value={inputs.cash} min={0} max={500000} step={5000}
                  format={v => fmtCurrency(v)} onChange={v => setInputs({ cash: v })}
                  tooltip="Money in checking, savings, or high-yield savings accounts." />
                <SliderInput label="401(k)" value={inputs.k401} min={0} max={2000000} step={5000}
                  format={v => fmtCurrency(v)} onChange={v => setInputs({ k401: v })}
                  tooltip="Employer-sponsored retirement account balance." />
                <SliderInput label="Roth IRA" value={inputs.rothIRA} min={0} max={500000} step={1000}
                  format={v => fmtCurrency(v)} onChange={v => setInputs({ rothIRA: v })}
                  tooltip="Retirement account funded with after-tax dollars. Withdrawals are tax-free." />
              </>
            )}

            {onboardingStep === 3 && (
              <>
                <SliderInput label="Annual 401(k) Contribution" value={inputs.k401Annual} min={0} max={69000} step={500}
                  format={v => fmtCurrency(v)} onChange={v => setInputs({ k401Annual: v })}
                  tooltip="How much you contribute to your 401(k) per year. IRS limit is $23,000 in 2024." />
                <SliderInput label="Employer Match %" value={inputs.employerMatchPct} min={0} max={0.10} step={0.005}
                  format={v => fmtPct(v)} onChange={v => setInputs({ employerMatchPct: v })}
                  tooltip="The % of your salary your employer matches. Free money — always maximize it." />
                <SliderInput label="Employer Match Cap" value={inputs.employerMatchCap} min={0} max={0.10} step={0.005}
                  format={v => fmtPct(v)} onChange={v => setInputs({ employerMatchCap: v })}
                  tooltip="The max % of salary that qualifies for the employer match." />
              </>
            )}

            {onboardingStep === 4 && (
              <>
                <SliderInput label="Base Annual Living Expenses" value={inputs.baseAnnualExpenses} min={20000} max={300000} step={2500}
                  format={v => fmtCurrency(v)} onChange={v => setInputs({ baseAnnualExpenses: v })}
                  tooltip="Your fixed annual spending — rent, groceries, utilities, insurance." />
                <SliderInput
                  label="Retirement Spending (% of pre-retirement)"
                  value={inputs.retirementSpendingEarly} min={0.40} max={1.10} step={0.05}
                  format={v => fmtPct(v)}
                  onChange={v => setInputs({
                    retirementSpendingEarly: v,
                    retirementSpendingMid: Math.max(0.40, v - 0.15),
                    retirementSpendingLate: Math.max(0.50, v - 0.05),
                  })}
                  tooltip="What % of your current spending you'll need in retirement. 70–80% is a common estimate." />
              </>
            )}

            {onboardingStep === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs mb-1">Nest Egg at Retirement</div>
                    <div className="text-teal-400 font-mono-nums text-xl font-bold">{fmtCurrency(retirementNW, true)}</div>
                    <div className="text-slate-500 text-xs mt-1">at age {inputs.retirementAge}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs mb-1">Monthly Income</div>
                    <div className="text-emerald-400 font-mono-nums text-xl font-bold">{fmtCurrency(monthlyIncome, true)}</div>
                    <div className="text-slate-500 text-xs mt-1">4% withdrawal</div>
                  </div>
                </div>
                <p className="text-slate-400 text-sm text-center leading-relaxed">
                  Your projection is ready. Head to Charts and Projections to explore the full picture — or adjust any number in Parameters.
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={prevOnboardingStep}
              disabled={isFirst}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors disabled:opacity-0 disabled:cursor-default"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className={`flex-1 py-2.5 text-white text-sm font-medium rounded-xl transition-colors ${
                isLast ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-teal-600 hover:bg-teal-500'
              }`}
            >
              {isLast ? 'Start exploring →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
