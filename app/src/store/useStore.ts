import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModelInputs, ProjectionRow, ModelSummary, ScenarioResult, MonteCarloResult } from '../engine/types'
import { DEFAULT_INPUTS } from '../engine/defaults'
import { runProjection } from '../engine/model'
import { sanitizeInputs, migratePersistedState, CURRENT_SCHEMA_VERSION } from '../engine/validate'
import { nanoid } from '../utils/nanoid'

const PRESET_COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']

export type AppMode = 'simple' | 'intermediate' | 'advanced'

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
  mode: AppMode
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
  onboardingType: 'advanced' | 'intermediate' | null

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
  switchToSimple: () => void
  switchToIntermediate: () => void
  switchToAdvanced: () => void
  dismissAdvancedWarning: () => void
  dismissOnboarding: () => void
  nextOnboardingStep: () => void
  prevOnboardingStep: () => void
}

function compute(inputs: ModelInputs) {
  return runProjection(inputs)
}

function mapSimpleToFull(
  simpleModeInputs: AppState['simpleModeInputs'],
  lifestylePct: number
): ModelInputs {
  const { currentAge, retirementAge, salary, totalSavings } = simpleModeInputs
  return {
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
      mode: 'simple',
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
      onboardingType: null,

      setInputs: (partial) => {
        const merged = { ...get().inputs, ...partial }
        // Defensive: a full-shape import (from JSON) may contain bad values.
        // Partial slider updates pass through sanitize unchanged.
        const next = sanitizeInputs(merged)
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
        const mapped = mapSimpleToFull(next, lifestylePct)
        const { rows, summary } = compute(mapped)
        set({ simpleModeInputs: next, rows, summary })
      },

      switchToSimple: () => set({ mode: 'simple' }),

      switchToIntermediate: () => {
        const { simpleModeInputs, mode } = get()
        // Only remap inputs if coming from simple mode
        if (mode === 'simple') {
          const lifestylePct = simpleModeInputs.lifestyle === 'necessities' ? 0.50 : simpleModeInputs.lifestyle === 'comfortable' ? 0.65 : 0.80
          const mapped = mapSimpleToFull(simpleModeInputs, lifestylePct)
          const { rows, summary } = compute(mapped)
          set({
            inputs: mapped, rows, summary,
            mode: 'intermediate',
            showAdvancedWarning: true,
            showOnboarding: true,
            onboardingStep: 0,
            onboardingType: 'intermediate',
          })
        } else {
          set({ mode: 'intermediate' })
        }
      },

      switchToAdvanced: () => {
        const { simpleModeInputs, mode } = get()
        if (mode === 'simple') {
          const lifestylePct = simpleModeInputs.lifestyle === 'necessities' ? 0.50 : simpleModeInputs.lifestyle === 'comfortable' ? 0.65 : 0.80
          const mapped = mapSimpleToFull(simpleModeInputs, lifestylePct)
          const { rows, summary } = compute(mapped)
          set({
            inputs: mapped, rows, summary,
            mode: 'advanced',
            showAdvancedWarning: true,
            showOnboarding: true,
            onboardingStep: 0,
            onboardingType: 'advanced',
          })
        } else {
          set({ mode: 'advanced', showOnboarding: false })
        }
      },

      dismissAdvancedWarning: () => set({ showAdvancedWarning: false }),

      dismissOnboarding: () => set({ showOnboarding: false, onboardingStep: 0, onboardingType: null }),

      nextOnboardingStep: () => {
        const { onboardingStep, onboardingType } = get()
        const maxSteps = onboardingType === 'intermediate' ? 2 : 6
        if (onboardingStep >= maxSteps) {
          set({ showOnboarding: false, onboardingStep: 0, onboardingType: null })
        } else {
          set({ onboardingStep: onboardingStep + 1 })
        }
      },

      prevOnboardingStep: () => {
        const { onboardingStep } = get()
        if (onboardingStep > 0) set({ onboardingStep: onboardingStep - 1 })
      },
    }),
    {
      name: 'life-finance-planner',
      version: CURRENT_SCHEMA_VERSION,
      migrate: (persistedState, fromVersion) => {
        return migratePersistedState(persistedState, fromVersion) as AppState
      },
      partialize: (state) => ({
        inputs: state.inputs,
        scenarios: state.scenarios,
        showNominal: state.showNominal,
        mode: state.mode,
        simpleModeInputs: state.simpleModeInputs,
        showAdvancedWarning: state.showAdvancedWarning,
        showOnboarding: state.showOnboarding,
        onboardingStep: state.onboardingStep,
        onboardingType: state.onboardingType,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        try {
          // Final guard — even after migrate, we recompute through sanitize so
          // a corrupted blob can never reach the engine with a malformed shape.
          state.inputs = sanitizeInputs(state.inputs)
          const { rows, summary } = compute(state.inputs)
          state.rows = rows
          state.summary = summary
        } catch (err) {
          console.error('[useStore] rehydration failed; resetting to defaults', err)
          const { rows, summary } = compute(sanitizeInputs(null))
          state.inputs = sanitizeInputs(null)
          state.rows = rows
          state.summary = summary
        }
      },
    }
  )
)
