import type { ModelInputs, Milestone, Debt, IncomeEvent } from './types'

export const DEFAULT_MILESTONES: Milestone[] = [
  { id: 'm1', age: 30, label: 'House Down Payment', cost: 100000, enabled: true },
  { id: 'm2', age: 35, label: 'New Car', cost: 40000, enabled: true },
  { id: 'm3', age: 40, label: 'Home Renovation', cost: 30000, enabled: true },
  { id: 'm4', age: 45, label: 'Child 1 College', cost: 120000, enabled: true },
  { id: 'm5', age: 47, label: 'Child 2 College', cost: 120000, enabled: true },
  { id: 'm6', age: 50, label: 'Major Home Upgrade', cost: 75000, enabled: true },
]

export const DEFAULT_DEBTS: Debt[] = []

export const DEFAULT_INCOME_EVENTS: IncomeEvent[] = []

export const DEFAULT_INPUTS: ModelInputs = {
  currentAge: 28,
  retirementAge: 65,
  filingStatus: 'single',

  salary: 225000,
  salaryGrowthRate: 0.07,
  spouseSalary: 0,
  spouseSalaryGrowthRate: 0.05,
  spouseRetirementAge: 65,
  sideIncomeAmount: 0,
  sideIncomeStartAge: 30,
  sideIncomeEndAge: 40,

  stocks: 110000,
  bonds: 0,
  cash: 160000,
  rothIRA: 15000,
  k401: 90000,
  hsa: 0,

  k401Annual: 24000,
  employerMatchPct: 0.04,
  employerMatchCap: 0.04,
  iraAnnual: 7000,
  hsaAnnual: 4150,
  backdoorRoth: false,

  stockReturn: 0.08,
  bondReturn: 0.04,
  cashReturn: 0.03,
  k401Return: 0.08,
  hsaReturn: 0.07,
  inflation: 0.03,

  effectiveTaxRate: 0.30,
  capitalGainsTaxRate: 0.15,
  stateTaxRate: 0.0,

  baseAnnualExpenses: 80000,
  discretionaryPct: 0.10,
  retirementSpendingEarly: 0.90,
  retirementSpendingMid: 0.70,
  retirementSpendingLate: 0.85,

  healthcarePreMedicare: 18000,
  healthcarePostMedicare: 3000,

  bridgeIncomeAmount: 0,
  bridgeIncomeStartAge: 55,
  bridgeIncomeEndAge: 65,

  rmdEnabled: true,

  stockAllocNow: 0.90,
  stockAllocAtRetirement: 0.50,

  socialSecurityEnabled: true,
  ssClaimingAge: 67,
  ssBenefitPct: 0.35,

  milestones: DEFAULT_MILESTONES,
  debts: DEFAULT_DEBTS,
  incomeEvents: DEFAULT_INCOME_EVENTS,
}
