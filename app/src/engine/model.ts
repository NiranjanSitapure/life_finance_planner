import type { ModelInputs, ProjectionRow, ModelSummary } from './types'

const ROTH_PHASEOUT_SINGLE = 146000
const ROTH_PHASEOUT_MARRIED = 230000

// IRS Uniform Lifetime Table (age -> distribution period)
const IRS_RMD_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0,
  79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0,
  86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8,
  93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4,
}

function rothPhaseOut(income: number, status: 'single' | 'married'): boolean {
  const limit = status === 'single' ? ROTH_PHASEOUT_SINGLE : ROTH_PHASEOUT_MARRIED
  return income > limit
}

function stockAllocForAge(
  age: number, currentAge: number, retirementAge: number,
  allocNow: number, allocAtRetirement: number
): number {
  if (age >= retirementAge) return allocAtRetirement
  const t = (age - currentAge) / (retirementAge - currentAge)
  return allocNow - t * (allocNow - allocAtRetirement)
}

function retirementSpendingMultiplier(
  age: number, retirementAge: number,
  early: number, mid: number, late: number
): number {
  const yearsIn = age - retirementAge
  if (yearsIn < 10) return early
  if (yearsIn < 20) return mid
  return late
}

export function runProjection(inputs: ModelInputs): { rows: ProjectionRow[]; summary: ModelSummary } {
  const {
    currentAge, retirementAge, filingStatus,
    salary, salaryGrowthRate, spouseSalary, spouseSalaryGrowthRate,
    sideIncomeAmount, sideIncomeStartAge, sideIncomeEndAge,
    k401Annual, employerMatchPct, employerMatchCap, iraAnnual, hsaAnnual,
    backdoorRoth, stockReturn, bondReturn, cashReturn, hsaReturn,
    inflation, effectiveTaxRate, capitalGainsTaxRate, stateTaxRate,
    baseAnnualExpenses, discretionaryPct,
    retirementSpendingEarly, retirementSpendingMid, retirementSpendingLate,
    healthcarePreMedicare, healthcarePostMedicare,
    bridgeIncomeAmount, bridgeIncomeStartAge, bridgeIncomeEndAge,
    rmdEnabled,
    stockAllocNow, stockAllocAtRetirement,
    socialSecurityEnabled, ssClaimingAge, ssBenefitPct,
    milestones, debts, incomeEvents,
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

  let stockCostBasis = inputs.stocks
  let bondCostBasis = inputs.bonds

  let lastPreRetirementExpenses = baseAnnualExpenses
  let finalPreRetirementSalary = salary
  let cumulativeEmployerMatch = 0
  let cumulativeCapGainsTax = 0
  let cumulativeSocialSecurity = 0
  let cumulativeRMDTax = 0

  // Build milestone map with inflation-adjusted costs
  const milestoneMap = new Map<number, { cost: number; label: string }>()
  for (const m of milestones) {
    if (!m.enabled) continue
    const yearsOut = m.age - currentAge
    milestoneMap.set(m.age, {
      cost: m.cost * Math.pow(1 + inflation, Math.max(0, yearsOut)),
      label: m.label,
    })
  }

  // Build income events map (multiple events can share an age)
  const incomeEventMap = new Map<number, { amount: number; label: string; taxable: boolean }[]>()
  for (const ev of incomeEvents) {
    if (!incomeEventMap.has(ev.age)) incomeEventMap.set(ev.age, [])
    incomeEventMap.get(ev.age)!.push({ amount: ev.amount, label: ev.label, taxable: ev.taxable })
  }

  // FIRE target based on early retirement spending (most conservative)
  const fireTarget = (baseAnnualExpenses * retirementSpendingEarly) / 0.04

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
    let healthcareCost = 0
    let bridgeIncome = 0
    let rmdAmount = 0
    let windfall = 0

    const sideIncome = age >= sideIncomeStartAge && age <= sideIncomeEndAge ? sideIncomeAmount : 0

    // --- Healthcare cost ---
    if (isRetired) {
      healthcareCost = age < 65
        ? healthcarePreMedicare * Math.pow(1 + inflation, age - retirementAge)
        : healthcarePostMedicare * Math.pow(1 + inflation, age - retirementAge)
    }

    // --- Bridge income (post-tax, part-time work in early retirement) ---
    if (isRetired && bridgeIncomeAmount > 0 && age >= bridgeIncomeStartAge && age <= bridgeIncomeEndAge) {
      bridgeIncome = bridgeIncomeAmount * (1 - (effectiveTaxRate * 0.5)) // lighter tax on part-time
    }

    // --- Living expenses ---
    let livingExp: number
    if (isRetired) {
      const smileMult = retirementSpendingMultiplier(
        age, retirementAge,
        retirementSpendingEarly, retirementSpendingMid, retirementSpendingLate
      )
      livingExp =
        lastPreRetirementExpenses *
        smileMult *
        Math.pow(1 + inflation, age - retirementAge)
    } else {
      const baseCPI = baseAnnualExpenses * Math.pow(1 + inflation, yearsElapsed)
      const discretionary = Math.max(0, sal - 100000) * discretionaryPct
      livingExp = baseCPI + discretionary
      lastPreRetirementExpenses = livingExp
    }

    // --- Social Security (with COLA: SS grows with inflation) ---
    if (socialSecurityEnabled && age >= ssClaimingAge) {
      const yearsOfCOLA = age - ssClaimingAge
      ssIncome = finalPreRetirementSalary * ssBenefitPct * Math.pow(1 + inflation, yearsOfCOLA)
      cumulativeSocialSecurity += ssIncome
    }

    // --- RMDs (age 73+) ---
    if (isRetired && rmdEnabled && age >= 73 && k401 > 0) {
      const period = IRS_RMD_TABLE[Math.min(age, 100)] ?? 6.4
      rmdAmount = k401 / period
      // Force withdrawal from 401k, apply income tax
      const rmdTax = rmdAmount * (effectiveTaxRate + stateTaxRate)
      cumulativeRMDTax += rmdTax
      k401 -= rmdAmount
      const afterTaxRMD = rmdAmount - rmdTax
      // If after-tax RMD exceeds net drawdown need, invest surplus in stocks
      const totalNeed = Math.max(0, livingExp + healthcareCost - ssIncome - bridgeIncome)
      if (afterTaxRMD > totalNeed) {
        const surplus = afterTaxRMD - totalNeed
        stocks += surplus
        stockCostBasis += surplus
        cash += totalNeed
      } else {
        cash += afterTaxRMD
      }
    }

    // --- Income events (windfalls) ---
    if (incomeEventMap.has(age)) {
      for (const ev of incomeEventMap.get(age)!) {
        const afterTax = ev.taxable
          ? ev.amount * (1 - (effectiveTaxRate + stateTaxRate))
          : ev.amount
        windfall += afterTax
        cash += afterTax
      }
    }

    if (!isRetired) {
      grossSalary = sal + spSal + sideIncome
      const k401Contrib = Math.min(k401Annual, sal * 0.5)
      k401EmployerMatch = Math.min(sal * employerMatchPct, sal * employerMatchCap)
      const taxableIncome = grossSalary - k401Contrib
      const totalTaxRate = effectiveTaxRate + stateTaxRate
      const incomeTax = taxableIncome * totalTaxRate
      postTaxIncome = taxableIncome - incomeTax

      const phaseOut = rothPhaseOut(taxableIncome, filingStatus)
      if (!phaseOut || backdoorRoth) toRoth = iraAnnual
      toHSA = hsaAnnual

      for (const d of debts) {
        if (age < d.payoffAge) debtPayments += d.annualPayment
      }

      const cashFlow = postTaxIncome - livingExp - toRoth - toHSA - debtPayments
      if (cashFlow > 0) {
        toStocks = cashFlow
        stockCostBasis += toStocks
      } else {
        cash += cashFlow
        if (cash < 0) {
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

    // Asset allocation glide path
    const stockPct = stockAllocForAge(age, currentAge, retirementAge, stockAllocNow, stockAllocAtRetirement)

    // Returns
    const stkRet = stocks * stockReturn
    const bndRet = bonds * bondReturn
    const cshRet = cash * cashReturn
    const rothRet = roth * stockReturn
    const k401Ret = k401 * (inputs.k401Return || stockReturn)
    const hsaRet = hsa * hsaReturn

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
      // Apply returns
      k401 += k401Ret
      roth += rothRet
      hsa += hsaRet
      stocks += stkRet
      bonds += bndRet
      cash += cshRet

      // Net drawdown after SS, bridge income, RMD cash injection
      const rmdCashCovered = (rmdEnabled && age >= 73) ? Math.min(rmdAmount * (1 - effectiveTaxRate - stateTaxRate), Math.max(0, livingExp + healthcareCost - ssIncome - bridgeIncome)) : 0
      const netDrawdown = Math.max(0, livingExp + healthcareCost - ssIncome - bridgeIncome - rmdCashCovered)

      if (cash >= netDrawdown) {
        cash -= netDrawdown
      } else {
        const remaining = netDrawdown - cash
        cash = 0
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
      if (cash >= remaining) { cash -= remaining; remaining = 0 }
      else { remaining -= cash; cash = 0 }
      if (remaining > 0 && stocks >= remaining) {
        const gainsPct = stocks > 0 ? Math.max(0, (stocks - stockCostBasis) / stocks) : 0
        const tax = remaining * gainsPct * capitalGainsTaxRate
        capGainsTaxPaid += tax
        cumulativeCapGainsTax += tax
        stocks -= remaining + tax
        stockCostBasis = Math.max(0, stockCostBasis - remaining)
        remaining = 0
      }
      if (remaining > 0 && bonds >= remaining) { bonds -= remaining }
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
      age, year, grossSalary, postTaxIncome, livingExpenses: livingExp,
      debtPayments, netSavings, stocks, bonds, cash,
      rothIRA: roth, k401, k401EmployerMatch, hsa,
      socialSecurityIncome: ssIncome,
      healthcareCost, bridgeIncome, rmdAmount, windfall,
      netWorth, realNetWorth,
      stockAllocationPct: stockPct,
      milestoneCost, milestoneLabel,
      capGainsTaxPaid, portfolioDeficit, fireTarget,
      cumulativeEmployerMatch, cumulativeCapGainsTax, cumulativeSocialSecurity,
    })

    if (age === retirementAge) finalPreRetirementSalary = sal

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
  const rothPhaseOutWarn = rothPhaseOut(salary - Math.min(k401Annual, salary * 0.5), filingStatus)

  // Break-even age: first year investment returns exceed total annual expenses
  const breakEvenRow = rows.find(r => {
    const annualReturn = r.netWorth * 0.04
    return annualReturn >= r.livingExpenses + r.healthcareCost
  })

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
    totalRMDTaxPaid: cumulativeRMDTax,
    breakEvenAge: breakEvenRow?.age ?? null,
    yearsToRetirement: retirementAge - currentAge,
    rothPhaseOutWarning: rothPhaseOutWarn,
    deficitYears,
  }

  return { rows, summary }
}
