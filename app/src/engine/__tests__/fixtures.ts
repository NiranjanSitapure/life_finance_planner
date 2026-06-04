import type { ModelInputs } from '../types'
import { DEFAULT_INPUTS } from '../defaults'

// Each fixture is a representative user. If the engine's output changes for
// any of these, the snapshot test will fail loudly. This is the safety net.
// To intentionally accept new output: run `npm run test:update`.

export const FIXTURES: Record<string, ModelInputs> = {
  // 28yo software engineer, high salary, moderate savings — the default profile
  default_young_high_earner: DEFAULT_INPUTS,

  // 22yo just starting out, low salary, no savings
  early_career: {
    ...DEFAULT_INPUTS,
    currentAge: 22,
    retirementAge: 65,
    salary: 55000,
    salaryGrowthRate: 0.05,
    stocks: 0,
    bonds: 0,
    cash: 2000,
    rothIRA: 0,
    k401: 0,
    hsa: 0,
    k401Annual: 3000,
    iraAnnual: 0,
    hsaAnnual: 0,
    baseAnnualExpenses: 35000,
    milestones: [],
    debts: [],
    incomeEvents: [],
  },

  // 45yo mid-career, married, dual income, kids
  mid_career_married: {
    ...DEFAULT_INPUTS,
    currentAge: 45,
    retirementAge: 62,
    filingStatus: 'married',
    salary: 180000,
    spouseSalary: 110000,
    stocks: 350000,
    bonds: 50000,
    cash: 80000,
    rothIRA: 90000,
    k401: 450000,
    hsa: 25000,
    baseAnnualExpenses: 110000,
    stateTaxRate: 0.06,
  },

  // 58yo near retirement, high net worth, planning early exit
  pre_retirement_fire: {
    ...DEFAULT_INPUTS,
    currentAge: 58,
    retirementAge: 60,
    salary: 250000,
    stocks: 900000,
    bonds: 200000,
    cash: 150000,
    rothIRA: 220000,
    k401: 850000,
    hsa: 60000,
    baseAnnualExpenses: 95000,
    bridgeIncomeAmount: 40000,
    bridgeIncomeStartAge: 60,
    bridgeIncomeEndAge: 67,
    stockAllocNow: 0.65,
    stockAllocAtRetirement: 0.45,
  },

  // 35yo with debts, mortgage, planned milestones
  with_debts_and_milestones: {
    ...DEFAULT_INPUTS,
    currentAge: 35,
    retirementAge: 67,
    salary: 130000,
    stocks: 60000,
    cash: 40000,
    k401: 180000,
    rothIRA: 35000,
    baseAnnualExpenses: 70000,
    debts: [
      { id: 'd1', label: 'Mortgage', type: 'mortgage', balance: 420000, annualPayment: 28000, payoffAge: 65 },
      { id: 'd2', label: 'Student Loan', type: 'student_loan', balance: 45000, annualPayment: 7200, payoffAge: 42 },
    ],
    incomeEvents: [
      { id: 'e1', age: 40, label: 'Inheritance', amount: 100000, taxable: false },
      { id: 'e2', age: 50, label: 'RSU Vest', amount: 75000, taxable: true },
    ],
  },
}
