import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModelInputs, ProjectionRow, ModelSummary, ScenarioResult, MonteCarloResult } from '../engine/types'
import { DEFAULT_INPUTS } from '../engine/defaults'
import { runProjection } from '../engine/model'
import { nanoid } from '../utils/nanoid'

const PRESET_COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']

interface AppState {
  inputs: ModelInputs
  rows: ProjectionRow[]
  summary: ModelSummary
  scenarios: ScenarioResult[]
  monteCarlo: MonteCarloResult | null
  mcRunning: boolean
  mcProgress: number
  activeSection: string
  showNominal: boolean

  setInputs: (inputs: Partial<ModelInputs>) => void
  resetInputs: () => void
  saveScenario: (name: string) => void
  deleteScenario: (id: string) => void
  setMonteCarlo: (result: MonteCarloResult | null) => void
  setMcRunning: (v: boolean) => void
  setMcProgress: (v: number) => void
  setActiveSection: (s: string) => void
  toggleNominal: () => void
}

function compute(inputs: ModelInputs) {
  return runProjection(inputs)
}

const initial = compute(DEFAULT_INPUTS)

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      rows: initial.rows,
      summary: initial.summary,
      scenarios: [],
      monteCarlo: null,
      mcRunning: false,
      mcProgress: 0,
      activeSection: 'dashboard',
      showNominal: true,

      setInputs: (partial) => {
        const next = { ...get().inputs, ...partial }
        const { rows, summary } = compute(next)
        set({ inputs: next, rows, summary })
      },

      resetInputs: () => {
        const { rows, summary } = compute(DEFAULT_INPUTS)
        set({ inputs: DEFAULT_INPUTS, rows, summary })
      },

      saveScenario: (name) => {
        const { inputs, rows, summary, scenarios } = get()
        const color = PRESET_COLORS[scenarios.length % PRESET_COLORS.length]
        const scenario: ScenarioResult = {
          id: nanoid(),
          name,
          color,
          inputs: { ...inputs },
          rows: [...rows],
          summary: { ...summary },
        }
        set({ scenarios: [...scenarios, scenario] })
      },

      deleteScenario: (id) => {
        set({ scenarios: get().scenarios.filter(s => s.id !== id) })
      },

      setMonteCarlo: (result) => set({ monteCarlo: result }),
      setMcRunning: (v) => set({ mcRunning: v }),
      setMcProgress: (v) => set({ mcProgress: v }),
      setActiveSection: (s) => set({ activeSection: s }),
      toggleNominal: () => set({ showNominal: !get().showNominal }),
    }),
    {
      name: 'life-finance-planner',
      partialize: (state) => ({
        inputs: state.inputs,
        scenarios: state.scenarios,
        showNominal: state.showNominal,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { rows, summary } = compute(state.inputs)
          state.rows = rows
          state.summary = summary
        }
      },
    }
  )
)
