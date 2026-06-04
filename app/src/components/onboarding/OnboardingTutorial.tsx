import { useStore } from '../../store/useStore'

const ADVANCED_STEPS = [
  {
    icon: '🎯',
    title: 'Welcome to Advanced Mode',
    section: null,
    sectionLabel: null,
    description: `Your settings have been pre-filled from your Basic mode inputs, with smart defaults for everything else.

Over the next steps, we'll walk you through each section so you can tune the numbers to match your real financial situation.

The more accurate your inputs, the more accurate your projection. You can always come back and adjust anything later.`,
    action: "Let's start →",
  },
  {
    icon: '💼',
    title: 'Step 1 — Your Income',
    section: 'inputs',
    sectionLabel: 'Parameters → Income',
    description: `Head to Parameters and open the Income section.

Set your exact gross salary, expected raises, and any side income from freelancing or rental properties. If you have a spouse or partner, add their income too.

Getting income right is the most important input — everything else flows from this.`,
    action: 'Got it →',
  },
  {
    icon: '🏦',
    title: 'Step 2 — Account Balances',
    section: 'inputs',
    sectionLabel: 'Parameters → Starting Balances',
    description: `In Starting Balances, break down your savings by account type:

• Taxable brokerage (Fidelity, Schwab, Robinhood)
• Cash / High-Yield Savings
• 401(k) balance
• Roth IRA balance
• HSA balance

Each account type has different tax treatment — the split matters for accurate projections.`,
    action: 'Got it →',
  },
  {
    icon: '📈',
    title: 'Step 3 — Contributions & Matching',
    section: 'inputs',
    sectionLabel: 'Parameters → Contributions',
    description: `Set your annual 401(k) contribution and your employer's match rate.

The employer match is free money — always contribute at least enough to get the full match.

Check if your income is within Roth IRA limits ($146K single / $230K married). If not, enable the Backdoor Roth toggle. Tap ℹ on any field for a plain-English explanation.`,
    action: 'Got it →',
  },
  {
    icon: '🏠',
    title: 'Step 4 — Life Milestones',
    section: 'milestones',
    sectionLabel: 'Milestones',
    description: `Go to Milestones to add major life expenses — a home purchase, new car, college tuition, renovations.

Enter costs in today's dollars. The planner automatically inflates them to what they'll actually cost when you reach that age.

We've pre-loaded common milestones. Delete any that don't apply and add your own.`,
    action: 'Got it →',
  },
  {
    icon: '💰',
    title: 'Step 5 — Debts & Windfalls',
    section: 'debts',
    sectionLabel: 'Debts & Income Events',
    description: `Two more sections worth checking:

Debts — Add your mortgage, student loans, and car payments. These reduce cash flow until paid off and significantly affect your savings trajectory.

Income Events — Add one-time windfalls: an expected bonus, RSU vest, inheritance, or home sale proceeds. These are often the biggest single boosts to net worth.`,
    action: 'Got it →',
  },
  {
    icon: '🎉',
    title: "You're All Set!",
    section: 'charts',
    sectionLabel: 'Charts & Monte Carlo',
    description: `Your financial plan is ready to explore:

📊 Charts — Net worth over time, asset breakdown, retirement drawdown

🎲 Monte Carlo — 1,000 simulations showing the probability your portfolio survives to 90

📋 Scenarios — "What if I retire at 55?" vs "Bear market?" side by side

Tap ℹ on any parameter for a plain-English explanation. Switch between Basic / Intermediate / Advanced anytime from the toggle at the top.`,
    action: 'Start exploring →',
  },
]

const INTERMEDIATE_STEPS = [
  {
    icon: '⚡',
    title: 'Welcome to Intermediate Mode',
    section: null,
    sectionLabel: null,
    description: `Intermediate mode gives you meaningful control without the complexity of the full advanced setup.

Your inputs have been pre-filled from your Basic mode estimates. Over the next few steps, we'll help you fill in the key details that make the biggest difference to your projection.`,
    action: "Let's go →",
  },
  {
    icon: '💼',
    title: 'Step 1 — Income & Accounts',
    section: 'inputs',
    sectionLabel: 'Parameters',
    description: `Go to Parameters and check:

• Your exact salary and expected annual raise
• Account balances split by type (stocks, cash, 401k, Roth IRA)
• Your annual 401(k) contribution and employer match

The employer match is free money — make sure you're capturing all of it.`,
    action: 'Got it →',
  },
  {
    icon: '🎉',
    title: "You're All Set!",
    section: 'charts',
    sectionLabel: 'Charts',
    description: `Your projection is ready. Check out:

📊 Charts — See your net worth grow over time and how retirement drawdown looks

📋 Projections — Year-by-year table of savings, income, and expenses

When you're ready for full control — milestones, debts, Monte Carlo simulations — switch to Advanced mode anytime from the toggle at the top.`,
    action: 'Start exploring →',
  },
]

export function OnboardingTutorial() {
  const {
    showOnboarding, onboardingStep, onboardingType,
    dismissOnboarding, nextOnboardingStep, prevOnboardingStep,
    setActiveSection
  } = useStore()

  if (!showOnboarding) return null

  const steps = onboardingType === 'intermediate' ? INTERMEDIATE_STEPS : ADVANCED_STEPS
  const step = steps[onboardingStep]
  const isFirst = onboardingStep === 0
  const isLast = onboardingStep === steps.length - 1

  const handleNext = () => {
    if (step.section) setActiveSection(step.section)
    nextOnboardingStep()
  }

  const handlePrev = () => {
    prevOnboardingStep()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className={`bg-slate-800 border rounded-2xl w-full max-w-lg shadow-2xl transition-all ${isLast ? 'border-teal-600' : 'border-slate-600'}`}>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-700 rounded-t-2xl overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isLast ? 'bg-emerald-500' : 'bg-teal-500'}`}
            style={{ width: `${((onboardingStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-5">
          {/* Top row: step count + skip */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs">
              {onboardingStep + 1} of {steps.length}
            </span>
            <button
              onClick={dismissOnboarding}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors p-1 rounded-lg hover:bg-slate-700"
              aria-label="Skip tutorial"
            >
              ✕ Skip
            </button>
          </div>

          {/* Dot progress */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i < onboardingStep) {
                    // allow going back via dots
                    useStore.setState({ onboardingStep: i })
                  }
                }}
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

          {/* Icon + Title */}
          <div className="text-center space-y-2">
            <div className="text-5xl">{step.icon}</div>
            <h3 className={`text-xl font-semibold ${isLast ? 'text-emerald-400' : 'text-slate-100'}`}>
              {step.title}
            </h3>
            {step.sectionLabel && (
              <span className="inline-block text-teal-400 text-xs bg-teal-900/40 border border-teal-800 px-3 py-1 rounded-full">
                → {step.sectionLabel}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="bg-slate-700/40 rounded-xl p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {step.description}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors disabled:opacity-0 disabled:cursor-default"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className={`flex-1 py-2.5 text-white text-sm font-medium rounded-xl transition-colors ${
                isLast
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-teal-600 hover:bg-teal-500'
              }`}
            >
              {step.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
