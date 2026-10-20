import { describe, it, expect } from 'vitest'
import { runRetirementMonteCarlo, simulateRetirementPaths } from '@/lib/projectionSim'

const baseParams = {
  startBalance: 1_200_000,
  expectedReturnPct: 0,
  inflationPct: 0,
  withdrawalRatePct: 4,
  startAge: 65,
  endAge: 70,
  annualVolatility: 0,
  sims: 20,
}

describe('runRetirementMonteCarlo', () => {
  it('withdraws a constant amount with zero volatility', () => {
    const result = runRetirementMonteCarlo({ ...baseParams, showRealValues: false })
    const final = result.paths[result.paths.length - 1]

    expect(result.paths[0].p50).toBe(1_200_000)
    expect(final.p50).toBeCloseTo(960_000, 2)
    expect(result.successRate).toBe(1)
  })

  it('reports failure when the portfolio depletes before the end age', () => {
    const result = runRetirementMonteCarlo({
      ...baseParams,
      startBalance: 100_000,
      withdrawalRatePct: 20,
      endAge: 80,
      showRealValues: false,
    })
    const final = result.paths[result.paths.length - 1]

    expect(final.p50).toBe(0)
    expect(result.successRate).toBe(0)
  })

  it('deflates balances when showing real values', () => {
    const params = {
      ...baseParams,
      startBalance: 120_000,
      withdrawalRatePct: 10,
      endAge: 66,
      inflationPct: 10,
    }
    const real = runRetirementMonteCarlo({ ...params, showRealValues: true })
    const nominal = runRetirementMonteCarlo({ ...params, showRealValues: false })

    expect(real.paths[real.paths.length - 1].p50).toBeCloseTo(108_000 / 1.1, 2)
    expect(nominal.paths[nominal.paths.length - 1].p50).toBeCloseTo(108_000, 2)
  })

  it('keeps the portfolio intact when no withdrawal is taken', () => {
    const result = runRetirementMonteCarlo({
      ...baseParams,
      startBalance: 100_000,
      withdrawalRatePct: 0,
    })

    expect(result.paths[result.paths.length - 1].p50).toBe(100_000)
    expect(result.successRate).toBe(1)
  })

  it('exposes the path-only wrapper', () => {
    const paths = simulateRetirementPaths({ ...baseParams, showRealValues: false })
    expect(paths).toHaveLength(6)
    expect(paths[0].age).toBe(65)
    expect(paths[paths.length - 1].age).toBe(70)
  })
})
