export interface Milestone {
  id: string
  age: number
  label: string
  cost: number // in today's dollars
  enabled: boolean
}

export interface Debt {
  id: string
  label: string
  type: 'mortgage' | 'student_loan' | 'car' | 'other'
  balance: number
  annualPayment: number
  payoffAge: number
}

export interface IncomeEvent {
  id: string
  age: number
  label: string
  amount: number  // gross amount (pre-tax)
  taxable: boolean
}

export interface ModelInputs {
  // Personal
  currentAge: number
  retirementAge: number
  filingStatus: 'single' | 'married'

  // Income
  salary: number
  salaryGrowthRate: number
  spouseSalary: number
  spouseSalaryGrowthRate: number
  spouseRetirementAge: number
  sideIncomeAmount: number
  sideIncomeStartAge: number
  sideIncomeEndAge: number

  // Starting balances
  stocks: number
  bonds: number
  cash: number
  rothIRA: number
  k401: number
  hsa: number

  // Contributions
  k401Annual: number
  employerMatchPct: number
  employerMatchCap: number
  iraAnnual: number
  hsaAnnual: number
  backdoorRoth: boolean

  // Economic assumptions
  stockReturn: number
  bondReturn: number
  cashReturn: number
  k401Return: number
  hsaReturn: number
  inflation: number

  // Tax
  effectiveTaxRate: number
  capitalGainsTaxRate: number
  stateTaxRate: number

  // Expenses
  baseAnnualExpenses: number
  discretionaryPct: number
  // Retirement spending smile curve
  retirementSpendingEarly: number   // ages retirementAge to retirementAge+10
  retirementSpendingMid: number     // ages retirementAge+10 to retirementAge+20
  retirementSpendingLate: number    // ages retirementAge+20+

  // Healthcare
  healthcarePreMedicare: number     // annual cost if retiring before 65
  healthcarePostMedicare: number    // annual Medicare + supplemental cost

  // Bridge income
  bridgeIncomeAmount: number
  bridgeIncomeStartAge: number
  bridgeIncomeEndAge: number

  // RMDs
  rmdEnabled: boolean

  // Asset allocation glide path
  stockAllocNow: number
  stockAllocAtRetirement: number

  // Social Security
  socialSecurityEnabled: boolean
  ssClaimingAge: number
  ssBenefitPct: number

  // Milestones
  milestones: Milestone[]

  // Debts
  debts: Debt[]
  incomeEvents: IncomeEvent[]
}

export interface ProjectionRow {
  age: number
  year: number
  grossSalary: number
  postTaxIncome: number
  livingExpenses: number
  debtPayments: number
  netSavings: number
  stocks: number
  bonds: number
  cash: number
  rothIRA: number
  k401: number
  k401EmployerMatch: number
  hsa: number
  socialSecurityIncome: number
  healthcareCost: number
  bridgeIncome: number
  rmdAmount: number
  windfall: number
  netWorth: number
  realNetWorth: number
  stockAllocationPct: number
  milestoneCost: number
  milestoneLabel: string
  capGainsTaxPaid: number
  portfolioDeficit: boolean
  fireTarget: number
  cumulativeEmployerMatch: number
  cumulativeCapGainsTax: number
  cumulativeSocialSecurity: number
}

export interface ModelSummary {
  startNetWorth: number
  retirementNetWorth: number
  retirementRealNetWorth: number
  safeWithdrawalIncome: number
  firstMillionAge: number | null
  fireNumber: number
  fireAge: number | null
  totalEmployerMatch: number
  totalCapGainsTax: number
  totalSocialSecurity: number
  totalRMDTaxPaid: number
  breakEvenAge: number | null
  yearsToRetirement: number
  rothPhaseOutWarning: boolean
  deficitYears: number[]
}

export interface ScenarioResult {
  id: string
  name: string
  color: string
  inputs: ModelInputs
  rows: ProjectionRow[]
  summary: ModelSummary
}

export interface MonteCarloResult {
  percentiles: {
    p10: number[]
    p25: number[]
    p50: number[]
    p75: number[]
    p90: number[]
  }
  ages: number[]
  probSurviveTo90: number
  probHitFire: number
  medianRetirementNW: number
  ci90Low: number
  ci90High: number
}
