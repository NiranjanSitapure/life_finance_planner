import type { ModelInputs, MonteCarloResult } from './types'
import { runProjection } from './model'

function randomNormal(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z * std
}

export function runMonteCarlo(
  inputs: ModelInputs,
  numSimulations: number,
  onProgress?: (pct: number) => void
): MonteCarloResult {
  const { currentAge, retirementAge } = inputs
  const HORIZON = Math.max(60, 90 - currentAge + 2)
  const ages = Array.from({ length: HORIZON }, (_, i) => currentAge + i)

  const allNW: number[][] = []
  let surviveTo90Count = 0
  let hitFireCount = 0
  const retirementNWs: number[] = []

  for (let s = 0; s < numSimulations; s++) {
    // Randomize returns — add sequence-of-returns stress for first 5 retirement years
    const simInputs: ModelInputs = {
      ...inputs,
      stockReturn: randomNormal(inputs.stockReturn, 0.15),
      bondReturn: randomNormal(inputs.bondReturn, 0.05),
      inflation: Math.max(0.005, randomNormal(inputs.inflation, 0.01)),
      salaryGrowthRate: Math.max(0, randomNormal(inputs.salaryGrowthRate, 0.02)),
    }

    // Extra stress: reduce stock return in first 5 retirement years
    // We simulate this by reducing overall stock return for bad scenarios
    const isStressScenario = Math.random() < 0.3
    if (isStressScenario) {
      simInputs.stockReturn = Math.max(-0.3, simInputs.stockReturn - 0.15)
    }

    const { rows, summary } = runProjection(simInputs)

    const nwByAge = rows.map(r => r.netWorth)
    allNW.push(nwByAge)

    const retRow = rows.find(r => r.age === retirementAge)
    if (retRow) retirementNWs.push(retRow.netWorth)

    const age90Row = rows.find(r => r.age === 90)
    if (age90Row && age90Row.netWorth > 0) surviveTo90Count++

    if (summary.fireAge !== null) hitFireCount++

    if (onProgress && s % 50 === 0) {
      onProgress(Math.round((s / numSimulations) * 100))
    }
  }

  // Compute percentile bands
  const percentiles = {
    p10: ages.map((_, i) => percentile(allNW.map(s => s[i] ?? 0), 0.10)),
    p25: ages.map((_, i) => percentile(allNW.map(s => s[i] ?? 0), 0.25)),
    p50: ages.map((_, i) => percentile(allNW.map(s => s[i] ?? 0), 0.50)),
    p75: ages.map((_, i) => percentile(allNW.map(s => s[i] ?? 0), 0.75)),
    p90: ages.map((_, i) => percentile(allNW.map(s => s[i] ?? 0), 0.90)),
  }

  retirementNWs.sort((a, b) => a - b)
  const medianRetirementNW = percentile(retirementNWs, 0.50)
  const ci90Low = percentile(retirementNWs, 0.05)
  const ci90High = percentile(retirementNWs, 0.95)

  return {
    percentiles,
    ages,
    probSurviveTo90: surviveTo90Count / numSimulations,
    probHitFire: hitFireCount / numSimulations,
    medianRetirementNW,
    ci90Low,
    ci90High,
  }
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}
