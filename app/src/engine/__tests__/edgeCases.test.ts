import { describe, it, expect } from 'vitest'
import { runProjection } from '../model'
import { DEFAULT_INPUTS } from '../defaults'

function run(overrides: Partial<typeof DEFAULT_INPUTS>) {
  return runProjection({ ...DEFAULT_INPUTS, ...overrides })
}

describe('engine edge cases', () => {
  it('does not throw with zero salary', () => {
    expect(() => run({ salary: 0, spouseSalary: 0 })).not.toThrow()
  })

  it('does not throw with zero starting balances', () => {
    expect(() => run({ stocks: 0, bonds: 0, cash: 0, rothIRA: 0, k401: 0, hsa: 0 })).not.toThrow()
  })

  it('does not throw with zero returns (no investment growth)', () => {
    expect(() => run({
      stockReturn: 0, bondReturn: 0, cashReturn: 0, k401Return: 0, hsaReturn: 0,
    })).not.toThrow()
  })

  it('does not throw when retirement age equals current age', () => {
    expect(() => run({ currentAge: 50, retirementAge: 50 })).not.toThrow()
  })

  it('does not throw when SS claiming age equals retirement age', () => {
    expect(() => run({ retirementAge: 62, ssClaimingAge: 62 })).not.toThrow()
  })

  it('does not throw when SS claiming age is before retirement age', () => {
    expect(() => run({ retirementAge: 67, ssClaimingAge: 62 })).not.toThrow()
  })

  it('does not throw with very high inflation (10%)', () => {
    expect(() => run({ inflation: 0.10 })).not.toThrow()
  })

  it('does not throw with negative stock returns (bear market crash)', () => {
    expect(() => run({ stockReturn: -0.20, k401Return: -0.20 })).not.toThrow()
  })

  it('retirementNetWorth is zero or positive', () => {
    const { summary } = run({ salary: 0, stocks: 0, bonds: 0, cash: 0, rothIRA: 0, k401: 0, hsa: 0 })
    expect(summary.retirementNetWorth).toBeGreaterThanOrEqual(0)
  })

  it('all row netWorth values are finite', () => {
    const { rows } = run({})
    rows.forEach(r => expect(Number.isFinite(r.netWorth)).toBe(true))
  })

  it('grossSalary is zero in all retirement rows', () => {
    const { rows } = run({ retirementAge: 55 })
    const retirementRows = rows.filter(r => r.age >= 55)
    retirementRows.forEach(r => expect(r.grossSalary).toBe(0))
  })

  it('SS income is zero before ssClaimingAge', () => {
    const { rows } = run({ ssClaimingAge: 70 })
    const preClaimRows = rows.filter(r => r.age < 70)
    preClaimRows.forEach(r => expect(r.socialSecurityIncome).toBe(0))
  })

  it('SS income is bounded by SS_MAX with COLA when salary is very high', () => {
    const { rows } = run({ salary: 1_000_000, ssBenefitPct: 1.0 })
    const retRows = rows.filter(r => r.socialSecurityIncome > 0)
    // Base is capped at ~$45,864, so first claiming year should be near that value
    if (retRows.length > 0) {
      expect(retRows[0].socialSecurityIncome).toBeLessThan(200_000)
    }
  })

  it('portfolioDeficit never fires in working years', () => {
    const { rows } = run({})
    const workingRows = rows.filter(r => r.age < DEFAULT_INPUTS.retirementAge)
    workingRows.forEach(r => expect(r.portfolioDeficit).toBe(false))
  })

  it('fmtCurrency guard — engine never produces NaN in standard scenario', () => {
    const { rows } = run({})
    rows.forEach(r => {
      expect(Number.isFinite(r.netWorth)).toBe(true)
      expect(Number.isFinite(r.livingExpenses)).toBe(true)
      expect(Number.isFinite(r.postTaxIncome)).toBe(true)
    })
  })
})
