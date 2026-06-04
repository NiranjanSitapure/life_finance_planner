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
  isSimpleMode: boolean
  simpleModeInputs: {
    currentAge: number
    retirementAge: number
    salary: number
    totalSavings: number
    lifestyle: 'necessities' | 'comfortable' | 'lavish'
  }
  showAdvancedWarning: boolean
  showOnboarding: boolean
  onboardingStep: number

  setInputs: (inputs: Partial<ModelInputs>) => void
  resetInputs: () => void
  saveScenario: (name: string) => void
  deleteScenario: (id: string) => void
  setMonteCarlo: (result: MonteCarloResult | null) => void
  setMcRunning: (v: boolean) => void
  setMcProgress: (v: number) => void
  setActiveSection: (s: string) => void
  toggleNominal: () => void
  setSimpleModeInputs: (partial: Partial<AppState['simpleModeInputs']>) => void
  switchToAdvanced: () => void
  switchToSimple: () => void
  dismissAdvancedWarning: () => void
  dismissOnboarding: () => void
  nextOnboardingStep: () => void
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
      isSimpleMode: true,
      simpleModeInputs: {
        currentAge: 28,
        retirementAge: 65,
        salary: 75000,
        totalSavings: 25000,
        lifestyle: 'comfortable',
      },
      showAdvancedWarning: false,
      showOnboarding: false,
      onboardingStep: 0,

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

      setSimpleModeInputs: (partial) => {
        const next = { ...get().simpleModeInputs, ...partial }
        const lifestylePct = next.lifestyle === 'necessities' ? 0.50 : next.lifestyle === 'comfortable' ? 0.65 : 0.80
        const mapped: ModelInputs = {
          ...DEFAULT_INPUTS,
          currentAge: next.currentAge,
          retirementAge: next.retirementAge,
          salary: next.salary,
          stocks: Math.round(next.totalSavings * 0.30),
          k401: Math.round(next.totalSavings * 0.30),
          cash: Math.round(next.totalSavings * 0.25),
          rothIRA: Math.round(next.totalSavings * 0.15),
          bonds: 0,
          hsa: 0,
          baseAnnualExpenses: Math.round(next.salary * lifestylePct),
        }
        const { rows, summary } = compute(mapped)
        set({ simpleModeInputs: next, rows, summary })
      },

      switchToAdvanced: () => {
        const { simpleModeInputs } = get()
        const { currentAge, retirementAge, salary, totalSavings, lifestyle } = simpleModeInputs
        const lifestylePct = lifestyle === 'necessities' ? 0.50 : lifestyle === 'comfortable' ? 0.65 : 0.80
        const advancedInputs: ModelInputs = {
          ...DEFAULT_INPUTS,
          currentAge,
          retirementAge,
          salary,
          stocks: Math.round(totalSavings * 0.30),
          k401: Math.round(totalSavings * 0.30),
          cash: Math.round(totalSavings * 0.25),
          rothIRA: Math.round(totalSavings * 0.15),
          bonds: 0,
          hsa: 0,
          baseAnnualExpenses: Math.round(salary * lifestylePct),
        }
        const { rows, summary } = compute(advancedInputs)
        set({ inputs: advancedInputs, rows, summary, isSimpleMode: false, showAdvancedWarning: true, showOnboarding: true, onboardingStep: 0 })
      },

      switchToSimple: () => set({ isSimpleMode: true }),

      dismissAdvancedWarning: () => set({ showAdvancedWarning: false }),

      dismissOnboarding: () => set({ showOnboarding: false, onboardingStep: 0 }),
      nextOnboardingStep: () => {
        const { onboardingStep } = get()
        if (onboardingStep >= 6) {
          set({ showOnboarding: false, onboardingStep: 0 })
        } else {
          set({ onboardingStep: onboardingStep + 1 })
        }
      },
    }),
    {
      name: 'life-finance-planner',
      partialize: (state) => ({
        inputs: state.inputs,
        scenarios: state.scenarios,
        showNominal: state.showNominal,
        isSimpleMode: state.isSimpleMode,
        simpleModeInputs: state.simpleModeInputs,
        showAdvancedWarning: state.showAdvancedWarning,
        showOnboarding: state.showOnboarding,
        onboardingStep: state.onboardingStep,
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
