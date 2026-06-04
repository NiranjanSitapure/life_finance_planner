import { describe, it, expect } from 'vitest'
import { runProjection } from '../model'
import { FIXTURES } from './fixtures'
import type { ProjectionRow } from '../types'

// Reduce a full ProjectionRow to a numerically stable subset for snapshotting.
// Rounding to whole dollars protects against float drift across runs while
// still catching real regressions (a $1+ shift in any tracked field fails).
function snapshotRow(r: ProjectionRow) {
  return {
    age: r.age,
    grossSalary: Math.round(r.grossSalary),
    postTaxIncome: Math.round(r.postTaxIncome),
    livingExpenses: Math.round(r.livingExpenses),
    netSavings: Math.round(r.netSavings),
    stocks: Math.round(r.stocks),
    bonds: Math.round(r.bonds),
    cash: Math.round(r.cash),
    rothIRA: Math.round(r.rothIRA),
    k401: Math.round(r.k401),
    hsa: Math.round(r.hsa),
    socialSecurityIncome: Math.round(r.socialSecurityIncome),
    healthcareCost: Math.round(r.healthcareCost),
    bridgeIncome: Math.round(r.bridgeIncome),
    rmdAmount: Math.round(r.rmdAmount),
    windfall: Math.round(r.windfall),
    netWorth: Math.round(r.netWorth),
    realNetWorth: Math.round(r.realNetWorth),
    portfolioDeficit: r.portfolioDeficit,
    milestoneCost: Math.round(r.milestoneCost),
  }
}

describe('runProjection — golden master', () => {
  for (const [name, inputs] of Object.entries(FIXTURES)) {
    it(`stable output for: ${name}`, () => {
      const { rows, summary } = runProjection(inputs)

      const snapshot = {
        rows: rows.map(snapshotRow),
        summary: {
          startNetWorth: Math.round(summary.startNetWorth),
          retirementNetWorth: Math.round(summary.retirementNetWorth),
          retirementRealNetWorth: Math.round(summary.retirementRealNetWorth),
          safeWithdrawalIncome: Math.round(summary.safeWithdrawalIncome),
          firstMillionAge: summary.firstMillionAge,
          fireNumber: Math.round(summary.fireNumber),
          fireAge: summary.fireAge,
          totalEmployerMatch: Math.round(summary.totalEmployerMatch),
          totalCapGainsTax: Math.round(summary.totalCapGainsTax),
          totalSocialSecurity: Math.round(summary.totalSocialSecurity),
          totalRMDTaxPaid: Math.round(summary.totalRMDTaxPaid),
          breakEvenAge: summary.breakEvenAge,
          yearsToRetirement: summary.yearsToRetirement,
          rothPhaseOutWarning: summary.rothPhaseOutWarning,
          deficitYears: summary.deficitYears,
        },
      }

      expect(snapshot).toMatchSnapshot()
    })
  }

  it('determinism: same input always produces identical output', () => {
    const a = runProjection(FIXTURES.default_young_high_earner)
    const b = runProjection(FIXTURES.default_young_high_earner)
    expect(a).toEqual(b)
  })

  it('sanity: net worth at retirement is positive for default case', () => {
    const { summary } = runProjection(FIXTURES.default_young_high_earner)
    expect(summary.retirementNetWorth).toBeGreaterThan(0)
  })
})
