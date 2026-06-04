import { useStore } from '../../store/useStore'

const STEPS = [
  {
    step: 1,
    title: "Welcome to Advanced Mode 🎉",
    section: null,
    description: `Your settings have been pre-filled from your Simple mode inputs, with sensible defaults for everything else.

Over the next few steps, we'll walk you through each section so you can tune the numbers to match your real financial situation. The more accurate your inputs, the more accurate your projection.

Don't worry — you can always come back and adjust anything later.`,
    action: "Let's get started",
  },
  {
    step: 2,
    title: "Step 1 — Your Income",
    section: "inputs",
    sectionLabel: "Parameters → Income",
    description: `Head to the Parameters section and open the Income panel.

Here you can add:
• Your exact gross salary (pre-tax)
• Annual salary growth rate (how fast you expect raises)
• A spouse or partner's income
• Side income from freelancing, rental properties, or a second job

Getting your income right is the most important input — everything else is downstream of this.`,
    action: "Got it, next →",
  },
  {
    step: 3,
    title: "Step 2 — Your Account Balances",
    section: "inputs",
    sectionLabel: "Parameters → Starting Balances",
    description: `In the Starting Balances panel, break down your savings across account types:

• Taxable brokerage (Fidelity, Schwab, etc.)
• Cash / High-Yield Savings Account
• 401(k) balance
• Roth IRA balance
• HSA balance

We split your total savings estimate as a starting point, but your real split matters — 401(k) money grows differently than taxable brokerage money.`,
    action: "Got it, next →",
  },
  {
    step: 4,
    title: "Step 3 — Your 401(k) & Contributions",
    section: "inputs",
    sectionLabel: "Parameters → Contributions",
    description: `In the Contributions panel, set:

• How much you contribute to your 401(k) each year
• Your employer's matching rate (this is free money — always maximize it)
• Roth IRA contributions (check if your income is within limits)
• HSA contributions

If your income is too high for direct Roth contributions, toggle on Backdoor Roth. Tap the ℹ icon next to any field for a plain-English explanation.`,
    action: "Got it, next →",
  },
  {
    step: 5,
    title: "Step 4 — Life Milestones",
    section: "milestones",
    sectionLabel: "Milestones",
    description: `Go to the Milestones section to add major life expenses — a home purchase, new car, college tuition, renovations.

Enter costs in today's dollars. The planner automatically inflates them to what they'll actually cost when you reach that age.

We've pre-loaded some common milestones. Delete any that don't apply to you and add ones that do.`,
    action: "Got it, next →",
  },
  {
    step: 6,
    title: "Step 5 — Debts & Income Events",
    section: "debts",
    sectionLabel: "Debts & Income Events",
    description: `Two more sections worth checking:

Debts — Add your mortgage, student loans, car payments. These reduce your cash flow each year until paid off and meaningfully change your savings trajectory.

Income Events — Add one-time windfalls: an expected bonus, RSU vest, inheritance, or home sale. These are often the biggest single boosts to your net worth and are easy to miss.`,
    action: "Got it, next →",
  },
  {
    step: 7,
    title: "Step 6 — Explore Your Projection",
    section: "charts",
    sectionLabel: "Charts & Monte Carlo",
    description: `You're all set! Here's what to explore:

📊 Charts — See your net worth grow over time, how your assets are allocated, and what retirement drawdown looks like.

🎲 Monte Carlo — Run 1,000 simulations with randomized market returns to see the probability your portfolio survives to age 90.

📋 Scenarios — Compare "What if I retire at 55?" vs "What if the market underperforms?" side by side.

Remember: tap the ℹ icon on any parameter for an explanation. You can always switch back to Simple mode from the toggle at the top.`,
    action: "Start exploring →",
  },
]

export function OnboardingTutorial() {
  const { showOnboarding, onboardingStep, dismissOnboarding, nextOnboardingStep, setActiveSection } = useStore()

  if (!showOnboarding) return null

  const step = STEPS[onboardingStep]
  const handleNext = () => {
    if (step.section) setActiveSection(step.section)
    nextOnboardingStep()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Progress bar */}
        <div className="h-1 bg-slate-700 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-500"
            style={{ width: `${((onboardingStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-5">
          {/* Step counter */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">
              {onboardingStep + 1} of {STEPS.length}
            </span>
            {step.sectionLabel && (
              <span className="text-teal-400 text-xs bg-teal-900/40 border border-teal-800 px-2 py-1 rounded-full">
                → {step.sectionLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-slate-100 text-xl font-semibold">{step.title}</h3>

          {/* Description */}
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {step.description}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={dismissOnboarding}
              className="text-slate-500 hover:text-slate-400 text-xs transition-colors"
            >
              Skip tutorial
            </button>
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {step.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
