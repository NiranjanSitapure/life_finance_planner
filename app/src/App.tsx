import { useStore } from './store/useStore'
import { SimpleModeView } from './components/simple/SimpleModeView'
import { ModeToggle } from './components/layout/ModeToggle'
import { AdvancedWarningBanner } from './components/layout/AdvancedWarningBanner'
import { Sidebar } from './components/layout/Sidebar'
import { SectionWrapper } from './components/layout/SectionWrapper'
import { SummaryCards } from './components/dashboard/SummaryCards'
import { ParameterForm } from './components/inputs/ParameterForm'
import { ProjectionsTable } from './components/tables/ProjectionsTable'
import { NetWorthChart } from './components/charts/NetWorthChart'
import { AssetBreakdownChart } from './components/charts/AssetBreakdownChart'
import { ExpensesChart } from './components/charts/ExpensesChart'
import { GlidepathChart } from './components/charts/GlidepathChart'
import { DrawdownChart } from './components/charts/DrawdownChart'
import { MilestoneManager } from './components/inputs/MilestoneManager'
import { DebtManager } from './components/inputs/DebtManager'
import { IncomeEventManager } from './components/inputs/IncomeEventManager'
import { ScenarioPanel } from './components/scenarios/ScenarioPanel'
import { MonteCarloChart } from './components/charts/MonteCarloChart'
import { exportCSV, exportJSON } from './utils/exporters'

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
                if (data.inputs) useStore.getState().setInputs(data.inputs)
              } catch { alert('Invalid JSON file') }
            }
            reader.readAsText(file)
          }}
        />
      </label>
    </div>
  )
}

function ScenarioNetWorthSection() {
  const { scenarios } = useStore()
  if (scenarios.length === 0) return null
  return (
    <div className="mt-6">
      <NetWorthChart />
    </div>
  )
}

export default function App() {
  const { activeSection, isSimpleMode } = useStore()

  return (
    <div className="min-h-screen bg-slate-900">
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
              {!isSimpleMode && <ExportBar />}
            </div>
          </div>

          {!isSimpleMode && <AdvancedWarningBanner />}

          {isSimpleMode ? (
            <SimpleModeView />
          ) : (
            <>

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
              <ProjectionsTable />
            </SectionWrapper>
          )}

          {activeSection === 'charts' && (
            <SectionWrapper title="Visualizations">
              <div className="space-y-6">
                <NetWorthChart />
                <AssetBreakdownChart />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlidepathChart />
                  <ExpensesChart />
                </div>
                <DrawdownChart />
              </div>
            </SectionWrapper>
          )}

          {activeSection === 'milestones' && (
            <SectionWrapper
              title="Life Milestones"
              subtitle="Enter costs in today's dollars — automatically inflation-adjusted to target age"
            >
              <MilestoneManager />
            </SectionWrapper>
          )}

          {activeSection === 'debts' && (
            <SectionWrapper title="Debt Manager" subtitle="Deducted from cash flow each year until payoff age">
              <DebtManager />
            </SectionWrapper>
          )}

          {activeSection === 'income-events' && (
            <SectionWrapper
              title="Income Events"
              subtitle="One-time windfalls: bonuses, RSU vests, inheritances, home sale proceeds"
            >
              <IncomeEventManager />
            </SectionWrapper>
          )}

          {activeSection === 'scenarios' && (
            <SectionWrapper title="Scenario Analysis" subtitle="Compare preset and custom scenarios side by side">
              <ScenarioPanel />
              <ScenarioNetWorthSection />
            </SectionWrapper>
          )}

          {activeSection === 'montecarlo' && (
            <SectionWrapper title="Monte Carlo Simulation" subtitle="Probabilistic outcomes across thousands of randomized market scenarios">
              <MonteCarloChart />
            </SectionWrapper>
          )}

            </>
          )}

        </div>
      </main>
    </div>
  )
}
