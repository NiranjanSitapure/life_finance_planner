import type { ModelInputs, Milestone, Debt, IncomeEvent } from './types'
import { DEFAULT_INPUTS } from './defaults'

// Current schema version. Bump whenever ModelInputs gains/renames a field.
// The migrate() function must handle every prior version up to this one.
export const CURRENT_SCHEMA_VERSION = 1

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function num(v: unknown, fallback: number): number {
  return isFiniteNumber(v) ? v : fallback
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function str<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

function sanitizeMilestone(raw: unknown, fallbackId: string): Milestone | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  if (!isFiniteNumber(m.age) || !isFiniteNumber(m.cost)) return null
  return {
    id: typeof m.id === 'string' && m.id ? m.id : fallbackId,
    age: Math.round(m.age),
    label: typeof m.label === 'string' ? m.label : 'Milestone',
    cost: Math.max(0, m.cost),
    enabled: bool(m.enabled, true),
  }
}

function sanitizeDebt(raw: unknown, fallbackId: string): Debt | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  if (!isFiniteNumber(d.annualPayment) || !isFiniteNumber(d.payoffAge)) return null
  return {
    id: typeof d.id === 'string' && d.id ? d.id : fallbackId,
    label: typeof d.label === 'string' ? d.label : 'Debt',
    type: str(d.type, ['mortgage', 'student_loan', 'car', 'other'] as const, 'other'),
    balance: num(d.balance, 0),
    annualPayment: Math.max(0, d.annualPayment),
    payoffAge: Math.round(d.payoffAge),
  }
}

function sanitizeIncomeEvent(raw: unknown, fallbackId: string): IncomeEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (!isFiniteNumber(e.age) || !isFiniteNumber(e.amount)) return null
  return {
    id: typeof e.id === 'string' && e.id ? e.id : fallbackId,
    age: Math.round(e.age),
    label: typeof e.label === 'string' ? e.label : 'Income Event',
    amount: e.amount,
    taxable: bool(e.taxable, true),
  }
}

function sanitizeArray<T>(
  raw: unknown,
  sanitize: (item: unknown, fallbackId: string) => T | null,
  prefix: string
): T[] {
  if (!Array.isArray(raw)) return []
  const out: T[] = []
  raw.forEach((item, i) => {
    const sanitized = sanitize(item, `${prefix}-${i}`)
    if (sanitized) out.push(sanitized)
  })
  return out
}

/**
 * Coerce an unknown blob into a valid ModelInputs by merging over DEFAULT_INPUTS.
 * Any missing field falls back to the default; any malformed field is replaced.
 * This is the trust boundary for both localStorage rehydration and JSON import.
 */
export function sanitizeInputs(raw: unknown): ModelInputs {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_INPUTS }
  const r = raw as Record<string, unknown>
  const d = DEFAULT_INPUTS

  return {
    currentAge: Math.round(num(r.currentAge, d.currentAge)),
    retirementAge: Math.round(num(r.retirementAge, d.retirementAge)),
    filingStatus: str(r.filingStatus, ['single', 'married'] as const, d.filingStatus),

    salary: num(r.salary, d.salary),
    salaryGrowthRate: num(r.salaryGrowthRate, d.salaryGrowthRate),
    spouseSalary: num(r.spouseSalary, d.spouseSalary),
    spouseSalaryGrowthRate: num(r.spouseSalaryGrowthRate, d.spouseSalaryGrowthRate),
    sideIncomeAmount: num(r.sideIncomeAmount, d.sideIncomeAmount),
    sideIncomeStartAge: Math.round(num(r.sideIncomeStartAge, d.sideIncomeStartAge)),
    sideIncomeEndAge: Math.round(num(r.sideIncomeEndAge, d.sideIncomeEndAge)),

    stocks: num(r.stocks, d.stocks),
    bonds: num(r.bonds, d.bonds),
    cash: num(r.cash, d.cash),
    rothIRA: num(r.rothIRA, d.rothIRA),
    k401: num(r.k401, d.k401),
    hsa: num(r.hsa, d.hsa),

    k401Annual: num(r.k401Annual, d.k401Annual),
    employerMatchPct: num(r.employerMatchPct, d.employerMatchPct),
    employerMatchCap: num(r.employerMatchCap, d.employerMatchCap),
    iraAnnual: num(r.iraAnnual, d.iraAnnual),
    hsaAnnual: num(r.hsaAnnual, d.hsaAnnual),
    backdoorRoth: bool(r.backdoorRoth, d.backdoorRoth),

    stockReturn: num(r.stockReturn, d.stockReturn),
    bondReturn: num(r.bondReturn, d.bondReturn),
    cashReturn: num(r.cashReturn, d.cashReturn),
    k401Return: num(r.k401Return, d.k401Return),
    hsaReturn: num(r.hsaReturn, d.hsaReturn),
    inflation: num(r.inflation, d.inflation),

    effectiveTaxRate: num(r.effectiveTaxRate, d.effectiveTaxRate),
    capitalGainsTaxRate: num(r.capitalGainsTaxRate, d.capitalGainsTaxRate),
    stateTaxRate: num(r.stateTaxRate, d.stateTaxRate),

    baseAnnualExpenses: num(r.baseAnnualExpenses, d.baseAnnualExpenses),
    discretionaryPct: num(r.discretionaryPct, d.discretionaryPct),
    retirementSpendingEarly: num(r.retirementSpendingEarly, d.retirementSpendingEarly),
    retirementSpendingMid: num(r.retirementSpendingMid, d.retirementSpendingMid),
    retirementSpendingLate: num(r.retirementSpendingLate, d.retirementSpendingLate),

    healthcarePreMedicare: num(r.healthcarePreMedicare, d.healthcarePreMedicare),
    healthcarePostMedicare: num(r.healthcarePostMedicare, d.healthcarePostMedicare),

    bridgeIncomeAmount: num(r.bridgeIncomeAmount, d.bridgeIncomeAmount),
    bridgeIncomeStartAge: Math.round(num(r.bridgeIncomeStartAge, d.bridgeIncomeStartAge)),
    bridgeIncomeEndAge: Math.round(num(r.bridgeIncomeEndAge, d.bridgeIncomeEndAge)),

    rmdEnabled: bool(r.rmdEnabled, d.rmdEnabled),

    stockAllocNow: num(r.stockAllocNow, d.stockAllocNow),
    stockAllocAtRetirement: num(r.stockAllocAtRetirement, d.stockAllocAtRetirement),

    socialSecurityEnabled: bool(r.socialSecurityEnabled, d.socialSecurityEnabled),
    ssClaimingAge: Math.round(num(r.ssClaimingAge, d.ssClaimingAge)),
    ssBenefitPct: num(r.ssBenefitPct, d.ssBenefitPct),

    milestones: sanitizeArray(r.milestones, sanitizeMilestone, 'm') ?? d.milestones,
    debts: sanitizeArray(r.debts, sanitizeDebt, 'd'),
    incomeEvents: sanitizeArray(r.incomeEvents, sanitizeIncomeEvent, 'e'),
  }
}

/**
 * Migrate a persisted state blob from an older schema version to the current one.
 * Called by zustand/persist before rehydration. Returning a sanitized object
 * guarantees the engine never sees a malformed shape.
 */
export function migratePersistedState(state: unknown, fromVersion: number): unknown {
  if (!state || typeof state !== 'object') return state
  const s = state as Record<string, unknown>

  // Per-version transformations go here. Example for the future:
  //   if (fromVersion < 2) { s.newField = computeFromOld(s.oldField); delete s.oldField }
  void fromVersion

  // Always re-sanitize inputs as the final defensive step.
  if ('inputs' in s) {
    s.inputs = sanitizeInputs(s.inputs)
  }

  return s
}
