import { lazy, Suspense } from 'react'
import { useStore } from './store/useStore'
import { SimpleModeView } from './components/simple/SimpleModeView'
import { ModeToggle } from './components/layout/ModeToggle'
import { AdvancedWarningBanner } from './components/layout/AdvancedWarningBanner'
import { Sidebar } from './components/layout/Sidebar'
import { SectionWrapper } from './components/layout/SectionWrapper'
import { SummaryCards } from './components/dashboard/SummaryCards'
import { ParameterForm } from './components/inputs/ParameterForm'
import { IntermediateParameterForm } from './components/inputs/IntermediateParameterForm'
import { OnboardingTutorial } from './components/onboarding/OnboardingTutorial'
import { WelcomeDialog } from './components/onboarding/WelcomeDialog'
import { exportCSV, exportJSON } from './utils/exporters'

// Lazy-loaded heavy components — Vite emits a separate chunk for each,
// so recharts and the Monte Carlo engine are not in the initial bundle.
const ProjectionsTable = lazy(() => import('./components/tables/ProjectionsTable').then(m => ({ default: m.ProjectionsTable })))
const NetWorthChart = lazy(() => import('./components/charts/NetWorthChart').then(m => ({ default: m.NetWorthChart })))
const AssetBreakdownChart = lazy(() => import('./components/charts/AssetBreakdownChart').then(m => ({ default: m.AssetBreakdownChart })))
const ExpensesChart = lazy(() => import('./components/charts/ExpensesChart').then(m => ({ default: m.ExpensesChart })))
const GlidepathChart = lazy(() => import('./components/charts/GlidepathChart').then(m => ({ default: m.GlidepathChart })))
const DrawdownChart = lazy(() => import('./components/charts/DrawdownChart').then(m => ({ default: m.DrawdownChart })))
const MilestoneManager = lazy(() => import('./components/inputs/MilestoneManager').then(m => ({ default: m.MilestoneManager })))
const DebtManager = lazy(() => import('./components/inputs/DebtManager').then(m => ({ default: m.DebtManager })))
const IncomeEventManager = lazy(() => import('./components/inputs/IncomeEventManager').then(m => ({ default: m.IncomeEventManager })))
const ScenarioPanel = lazy(() => import('./components/scenarios/ScenarioPanel').then(m => ({ default: m.ScenarioPanel })))
const MonteCarloChart = lazy(() => import('./components/charts/MonteCarloChart').then(m => ({ default: m.MonteCarloChart })))

function ChartFallback() {
  return <div className="h-80 bg-slate-800 border border-slate-700 rounded-xl animate-pulse" />
}

function ExportBar() {
  const { rows, inputs, scenarios } = useStore()
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => exportCSV(rows)}
        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
      >
        ↓ CSV
      </button>
      <button
        onClick={() => exportJSON({ inputs, scenarios })}
        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
      >
        ↓ JSON
      </button>
      <label className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer">
        ↑ Import
        <input
          type="file"
          accept=".json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = ev => {
              try {
                const data = JSON.parse(ev.target?.result as string)
                if (!data || typeof data !== 'object' || !data.inputs) {
                  alert('Invalid file: missing "inputs" field')
                  return
                }
                useStore.getState().setInputs(data.inputs)
              } catch { alert('Invalid JSON file') }
            }
            reader.readAsText(file)
          }}
        />
      </label>
    </div>
  )
}

function RehydrationErrorBanner() {
  const { dismissRehydrationError } = useStore()
  return (
    <div className="bg-amber-900/50 border border-amber-700 rounded-xl p-4 flex items-center justify-between gap-4">
      <p className="text-amber-200 text-sm">
        Your saved settings could not be loaded and were reset to defaults. Your previous data may have been corrupted.
      </p>
      <button
        onClick={dismissRehydrationError}
        className="text-amber-400 hover:text-amber-200 text-xs whitespace-nowrap transition-colors"
      >
        Dismiss
      </button>
    </div>
  )
}

export default function App() {
  const { activeSection, mode, showAdvancedWarning, rehydrationError, hasSeenWelcome } = useStore()

  return (
    <div className="min-h-screen bg-slate-900">
      {!hasSeenWelcome && <WelcomeDialog />}
      <OnboardingTutorial />
      <Sidebar />
      <main className="md:ml-56 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Life Finance Planner</h1>
              <p className="text-slate-500 text-sm mt-1">Lifetime projections — all computed locally in your browser</p>
            </div>
            <div className="flex items-center gap-3">
              <ModeToggle />
              {mode !== 'simple' && <ExportBar />}
            </div>
          </div>

          {rehydrationError && <RehydrationErrorBanner />}

          {mode === 'simple' && <SimpleModeView />}

          {mode === 'intermediate' && (
            <>
              {showAdvancedWarning && <AdvancedWarningBanner />}
              {activeSection === 'dashboard' && (
                <SectionWrapper title="Dashboard" subtitle="Key metrics from your current projection">
                  <SummaryCards />
                </SectionWrapper>
              )}
              {activeSection === 'inputs' && (
                <SectionWrapper title="Parameters" subtitle="Adjust inputs — projections update instantly">
                  <IntermediateParameterForm />
                </SectionWrapper>
              )}
              {activeSection === 'projections' && (
                <SectionWrapper title="Year-by-Year Projections" subtitle="Toggle nominal vs inflation-adjusted values">
                  <Suspense fallback={<ChartFallback />}>
                    <ProjectionsTable />
                  </Suspense>
                </SectionWrapper>
              )}
              {activeSection === 'charts' && (
                <SectionWrapper title="Visualizations">
                  <div className="space-y-6">
                    <Suspense fallback={<ChartFallback />}><NetWorthChart /></Suspense>
                    <Suspense fallback={<ChartFallback />}><AssetBreakdownChart /></Suspense>
                    <Suspense fallback={<ChartFallback />}><DrawdownChart /></Suspense>
                  </div>
                </SectionWrapper>
              )}
            </>
          )}

          {mode === 'advanced' && (
            <>
              <AdvancedWarningBanner />

              {activeSection === 'dashboard' && (
                <SectionWrapper title="Dashboard" subtitle="Key metrics from your current projection">
                  <SummaryCards />
                </SectionWrapper>
              )}

              {activeSection === 'inputs' && (
                <SectionWrapper title="Parameters" subtitle="Adjust all inputs — projections update instantly">
                  <ParameterForm />
                </SectionWrapper>
              )}

              {activeSection === 'projections' && (
                <SectionWrapper title="Year-by-Year Projections" subtitle="Toggle nominal vs inflation-adjusted values">
                  <Suspense fallback={<ChartFallback />}>
                    <ProjectionsTable />
                  </Suspense>
                </SectionWrapper>
              )}

              {activeSection === 'charts' && (
                <SectionWrapper title="Visualizations">
                  <div className="space-y-6">
                    <Suspense fallback={<ChartFallback />}><NetWorthChart /></Suspense>
                    <Suspense fallback={<ChartFallback />}><AssetBreakdownChart /></Suspense>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Suspense fallback={<ChartFallback />}><GlidepathChart /></Suspense>
                      <Suspense fallback={<ChartFallback />}><ExpensesChart /></Suspense>
                    </div>
                    <Suspense fallback={<ChartFallback />}><DrawdownChart /></Suspense>
                  </div>
                </SectionWrapper>
              )}

              {activeSection === 'milestones' && (
                <SectionWrapper
                  title="Life Milestones"
                  subtitle="Enter costs in today's dollars — automatically inflation-adjusted to target age"
                >
                  <Suspense fallback={<div className="h-40 animate-pulse bg-slate-800 rounded-xl" />}>
                    <MilestoneManager />
                  </Suspense>
                </SectionWrapper>
              )}

              {activeSection === 'debts' && (
                <SectionWrapper title="Debt Manager" subtitle="Deducted from cash flow each year until payoff age">
                  <Suspense fallback={<div className="h-40 animate-pulse bg-slate-800 rounded-xl" />}>
                    <DebtManager />
                  </Suspense>
                </SectionWrapper>
              )}

              {activeSection === 'income-events' && (
                <SectionWrapper
                  title="Income Events"
                  subtitle="One-time windfalls: bonuses, RSU vests, inheritances, home sale proceeds"
                >
                  <Suspense fallback={<div className="h-40 animate-pulse bg-slate-800 rounded-xl" />}>
                    <IncomeEventManager />
                  </Suspense>
                </SectionWrapper>
              )}

              {activeSection === 'scenarios' && (
                <SectionWrapper title="Scenario Analysis" subtitle="Compare preset and custom scenarios side by side">
                  <Suspense fallback={<div className="h-40 animate-pulse bg-slate-800 rounded-xl" />}>
                    <ScenarioPanel />
                  </Suspense>
                  <div className="mt-6">
                    <Suspense fallback={<ChartFallback />}><NetWorthChart /></Suspense>
                  </div>
                </SectionWrapper>
              )}

              {activeSection === 'montecarlo' && (
                <SectionWrapper title="Monte Carlo Simulation" subtitle="Probabilistic outcomes across thousands of randomized market scenarios">
                  <Suspense fallback={<ChartFallback />}>
                    <MonteCarloChart />
                  </Suspense>
                </SectionWrapper>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  )
}
