import type { ModelInputs, ProjectionRow, ModelSummary } from './types'

// IRS 2024 Roth IRA phase-out thresholds
const ROTH_PHASEOUT_SINGLE = 146000
const ROTH_PHASEOUT_MARRIED = 230000

function rothPhaseOut(income: number, status: 'single' | 'married'): boolean {
  const limit = status === 'single' ? ROTH_PHASEOUT_SINGLE : ROTH_PHASEOUT_MARRIED
  return income > limit
}

function stockAllocForAge(
  age: number,
  currentAge: number,
  retirementAge: number,
  allocNow: number,
  allocAtRetirement: number
): number {
  if (age >= retirementAge) return allocAtRetirement
  const t = (age - currentAge) / (retirementAge - currentAge)
  return allocNow - t * (allocNow - allocAtRetirement)
}

export function runProjection(inputs: ModelInputs): { rows: ProjectionRow[]; summary: ModelSummary } {
  const {
    currentAge, retirementAge, filingStatus,
    salary, salaryGrowthRate, spouseSalary, spouseSalaryGrowthRate,
    sideIncomeAmount, sideIncomeStartAge, sideIncomeEndAge,
    k401Annual, employerMatchPct, employerMatchCap, iraAnnual, hsaAnnual,
    backdoorRoth, stockReturn, bondReturn, cashReturn, hsaReturn,
    inflation, effectiveTaxRate, capitalGainsTaxRate, stateTaxRate,
    baseAnnualExpenses, discretionaryPct, retirementSpendingPct,
    stockAllocNow, stockAllocAtRetirement,
    socialSecurityEnabled, ssClaimingAge, ssBenefitPct,
    milestones, debts,
  } = inputs

  const HORIZON = Math.max(60, 90 - currentAge + 2)
  const rows: ProjectionRow[] = []

  let age = currentAge
  let year = new Date().getFullYear()
  let sal = salary
  let spSal = spouseSalary

  let stocks = inputs.stocks
  let bonds = inputs.bonds
  let cash = inputs.cash
  let roth = inputs.rothIRA
  let k401 = inputs.k401
  let hsa = inputs.hsa

  // Track cost basis for capital gains (simplified: track total invested)
  let stockCostBasis = inputs.stocks
  let bondCostBasis = inputs.bonds

  let lastPreRetirementExpenses = baseAnnualExpenses
  let finalPreRetirementSalary = salary
  let cumulativeEmployerMatch = 0
  let cumulativeCapGainsTax = 0
  let cumulativeSocialSecurity = 0

  const milestoneMap = new Map<number, { cost: number; label: string }>()
  for (const m of milestones) {
    if (!m.enabled) continue
    const yearsOut = m.age - currentAge
    const inflatedCost = m.cost * Math.pow(1 + inflation, Math.max(0, yearsOut))
    milestoneMap.set(m.age, { cost: inflatedCost, label: m.label })
  }

  const fireTarget = (baseAnnualExpenses * retirementSpendingPct) / 0.04

  for (let i = 0; i < HORIZON; i++) {
    const isRetired = age > retirementAge
    const yearsElapsed = i

    let grossSalary = 0
    let postTaxIncome = 0
    let k401EmployerMatch = 0
    let toStocks = 0
    let toRoth = 0
    let toHSA = 0
    let debtPayments = 0
    let capGainsTaxPaid = 0
    let ssIncome = 0

    // Living expenses
    const sideIncome =
      age >= sideIncomeStartAge && age <= sideIncomeEndAge ? sideIncomeAmount : 0

    let livingExp: number
    if (isRetired) {
      livingExp =
        lastPreRetirementExpenses *
        retirementSpendingPct *
        Math.pow(1 + inflation, age - retirementAge)
    } else {
      const baseCPI = baseAnnualExpenses * Math.pow(1 + inflation, yearsElapsed)
      const discretionary = Math.max(0, sal - 100000) * discretionaryPct
      livingExp = baseCPI + discretionary
      lastPreRetirementExpenses = livingExp
    }

    // Social Security
    if (socialSecurityEnabled && age >= ssClaimingAge) {
      ssIncome = finalPreRetirementSalary * ssBenefitPct
      cumulativeSocialSecurity += ssIncome
    }

    if (!isRetired) {
      grossSalary = sal + spSal + sideIncome
      const k401Contrib = Math.min(k401Annual, sal * 0.5)
      k401EmployerMatch = Math.min(sal * employerMatchPct, sal * employerMatchCap)
      const taxableIncome = grossSalary - k401Contrib
      const totalTaxRate = effectiveTaxRate + stateTaxRate
      const incomeTax = taxableIncome * totalTaxRate
      postTaxIncome = taxableIncome - incomeTax

      // Roth eligibility
      const phaseOut = rothPhaseOut(taxableIncome, filingStatus)
      if (!phaseOut || backdoorRoth) {
        toRoth = iraAnnual
      }

      // HSA
      toHSA = hsaAnnual

      // Debt payments
      for (const d of debts) {
        if (age < d.payoffAge) {
          debtPayments += d.annualPayment
        }
      }

      // Cash flow
      const cashFlow = postTaxIncome - livingExp - toRoth - toHSA - debtPayments
      if (cashFlow > 0) {
        toStocks = cashFlow
        stockCostBasis += toStocks
      } else {
        // Cover shortfall from cash first
        cash += cashFlow
        if (cash < 0) {
          // Liquidate stocks
          const needed = -cash
          const gainsPct = stocks > 0 ? Math.max(0, (stocks - stockCostBasis) / stocks) : 0
          const taxOnGains = needed * gainsPct * capitalGainsTaxRate
          capGainsTaxPaid += taxOnGains
          cumulativeCapGainsTax += taxOnGains
          stocks -= needed + taxOnGains
          stockCostBasis = Math.max(0, stockCostBasis - needed)
          cash = 0
        }
      }
    }

    // Asset allocation
    const stockPct = stockAllocForAge(age, currentAge, retirementAge, stockAllocNow, stockAllocAtRetirement)
    const bondPct = 1 - stockPct

    // Returns (on starting balances)
    const blendedReturn = stockPct * stockReturn + bondPct * bondReturn
    const stkRet = stocks * stockReturn
    const bndRet = bonds * bondReturn
    const cshRet = cash * cashReturn
    const rothRet = roth * stockReturn
    const k401Ret = k401 * (inputs.k401Return || blendedReturn)
    const hsaRet = hsa * hsaReturn

    // Update balances
    if (!isRetired) {
      const k401Contrib = Math.min(k401Annual, sal * 0.5)
      k401 += k401Contrib + k401EmployerMatch + k401Ret
      cumulativeEmployerMatch += k401EmployerMatch
      roth += toRoth + rothRet
      hsa += toHSA + hsaRet
      stocks += toStocks + stkRet
      bonds += bndRet
      cash += cshRet
    } else {
      // Retirement drawdown
      k401 += k401Ret
      roth += rothRet
      hsa += hsaRet
      stocks += stkRet
      bonds += bndRet
      cash += cshRet

      const netDrawdown = Math.max(0, livingExp - ssIncome)
      // Draw from cash first
      if (cash >= netDrawdown) {
        cash -= netDrawdown
      } else {
        const remaining = netDrawdown - cash
        cash = 0
        // Draw from bonds next
        if (bonds >= remaining) {
          const gainsPctB = bonds > 0 ? Math.max(0, (bonds - bondCostBasis) / bonds) : 0
          const taxB = remaining * gainsPctB * capitalGainsTaxRate
          capGainsTaxPaid += taxB
          cumulativeCapGainsTax += taxB
          bonds -= remaining + taxB
          bondCostBasis = Math.max(0, bondCostBasis - remaining)
        } else {
          const fromBonds = bonds
          bonds = 0
          bondCostBasis = 0
          const fromStocks = remaining - fromBonds
          const gainsPctS = stocks > 0 ? Math.max(0, (stocks - stockCostBasis) / stocks) : 0
          const taxS = fromStocks * gainsPctS * capitalGainsTaxRate
          capGainsTaxPaid += taxS
          cumulativeCapGainsTax += taxS
          stocks -= fromStocks + taxS
          stockCostBasis = Math.max(0, stockCostBasis - fromStocks)
        }
      }
    }

    // Milestones
    let milestoneCost = 0
    let milestoneLabel = ''
    if (milestoneMap.has(age)) {
      const ms = milestoneMap.get(age)!
      milestoneCost = ms.cost
      milestoneLabel = ms.label
      let remaining = milestoneCost
      if (cash >= remaining) {
        cash -= remaining
        remaining = 0
      } else {
        remaining -= cash
        cash = 0
      }
      if (remaining > 0 && stocks >= remaining) {
        const gainsPct = stocks > 0 ? Math.max(0, (stocks - stockCostBasis) / stocks) : 0
        const tax = remaining * gainsPct * capitalGainsTaxRate
        capGainsTaxPaid += tax
        cumulativeCapGainsTax += tax
        stocks -= remaining + tax
        stockCostBasis = Math.max(0, stockCostBasis - remaining)
        remaining = 0
      }
      if (remaining > 0 && bonds >= remaining) {
        bonds -= remaining
        remaining = 0
      }
    }

    // Insolvency guard
    if (stocks < 0) stocks = 0
    if (bonds < 0) bonds = 0
    if (cash < 0) cash = 0
    const portfolioDeficit = (stocks + bonds + cash + roth + k401 + hsa) <= 0 && isRetired

    const netWorth = stocks + bonds + cash + roth + k401 + hsa
    const realNetWorth = netWorth / Math.pow(1 + inflation, yearsElapsed)
    const netSavings = isRetired ? 0 : postTaxIncome - livingExp - debtPayments

    rows.push({
      age,
      year,
      grossSalary,
      postTaxIncome,
      livingExpenses: livingExp,
      debtPayments,
      netSavings,
      stocks,
      bonds,
      cash,
      rothIRA: roth,
      k401,
      k401EmployerMatch,
      hsa,
      socialSecurityIncome: ssIncome,
      netWorth,
      realNetWorth,
      stockAllocationPct: stockPct,
      milestoneCost,
      milestoneLabel,
      capGainsTaxPaid,
      portfolioDeficit,
      fireTarget,
      cumulativeEmployerMatch,
      cumulativeCapGainsTax,
      cumulativeSocialSecurity,
    })

    if (age === retirementAge) {
      finalPreRetirementSalary = sal
    }

    sal *= 1 + salaryGrowthRate
    spSal *= 1 + spouseSalaryGrowthRate
    age++
    year++
  }

  // Summary
  const retRow = rows.find(r => r.age === retirementAge)
  const firstMillionRow = rows.find(r => r.netWorth >= 1_000_000)
  const fireRow = rows.find(r => r.netWorth >= fireTarget)
  const deficitYears = rows.filter(r => r.portfolioDeficit).map(r => r.age)
  const rothPhaseOutWarn = rothPhaseOut(
    salary - Math.min(k401Annual, salary * 0.5),
    filingStatus
  )

  const summary: ModelSummary = {
    startNetWorth: rows[0]?.netWorth ?? 0,
    retirementNetWorth: retRow?.netWorth ?? 0,
    retirementRealNetWorth: retRow?.realNetWorth ?? 0,
    safeWithdrawalIncome: (retRow?.netWorth ?? 0) * 0.04,
    firstMillionAge: firstMillionRow?.age ?? null,
    fireNumber: fireTarget,
    fireAge: fireRow?.age ?? null,
    totalEmployerMatch: rows[rows.length - 1]?.cumulativeEmployerMatch ?? 0,
    totalCapGainsTax: rows[rows.length - 1]?.cumulativeCapGainsTax ?? 0,
    totalSocialSecurity: rows[rows.length - 1]?.cumulativeSocialSecurity ?? 0,
    yearsToRetirement: retirementAge - currentAge,
    rothPhaseOutWarning: rothPhaseOutWarn,
    deficitYears,
  }

  return { rows, summary }
}
