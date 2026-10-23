import { describe, it, expect } from 'vitest'
import {
  calculateFutureValue,
  calculateSafeWithdrawal,
  calculateProjection,
  calculateYearlyProjections,
  calculateSimpleProjection,
  projectPersonAccounts,
} from '@/lib/engine'
import type { HouseholdConfig, AccountBalance, ContributionConfig, Assumptions } from '@/types/household'
import type { Account } from '@/types/person'

function makeHousehold(retirementAge: number): HouseholdConfig {
  return {
    retirement_age: retirementAge,
    expected_annual_income: 0,
  }
}

function makeBalances(rrsp: number, tfsa: number): AccountBalance {
  return {
    rrsp,
    tfsa,
    resp: 0,
    non_registered: 0,
  }
}

function makeContributions(rrsp: number, tfsa: number): ContributionConfig {
  return {
    rrsp_annual: rrsp,
    tfsa_annual: tfsa,
    resp_annual: 0,
    non_registered_annual: 0,
  }
}

function makeAssumptions(returnRate: number, inflationRate: number): Assumptions {
  return {
    return_rate: returnRate,
    inflation_rate: inflationRate,
  }
}

describe('engine: calculateFutureValue', () => {
  it('handles zero return rate as simple sum', () => {
    const fv = calculateFutureValue(1000, 100, 0, 12)
    expect(fv).toBe(2200)
  })

  it('compounds monthly correctly', () => {
    const monthlyRate = 0.06 / 12
    const fv = calculateFutureValue(10000, 500, monthlyRate, 12)
    expect(fv).toBeGreaterThan(16000)
    expect(fv).toBeLessThan(17000)
  })
})

describe('engine: calculateSafeWithdrawal', () => {
  it('calculates 4% rule withdrawal', () => {
    expect(calculateSafeWithdrawal(1000000)).toBe(40000)
  })
})

describe('engine: calculateProjection', () => {
  it('calculates projection basic case', () => {
    const result = calculateProjection(
      makeHousehold(65),
      makeBalances(50000, 30000),
      makeContributions(5000, 6000),
      makeAssumptions(7.0, 2.5),
      35
    )
    expect(result.current_age).toBe(35)
    expect(result.retirement_age).toBe(65)
    expect(result.years_to_retirement).toBe(30)
    expect(result.net_worth_at_retirement).toBeGreaterThan(80000)
    expect(result.annual_withdrawal).toBeGreaterThan(0)
  })

  it('handles zero years to retirement', () => {
    const result = calculateProjection(
      makeHousehold(65),
      makeBalances(100000, 50000),
      makeContributions(0, 0),
      makeAssumptions(7.0, 2.5),
      65
    )
    expect(result.years_to_retirement).toBe(0)
    expect(result.net_worth_at_retirement).toBe(150000)
    expect(result.annual_withdrawal).toBe(0)
  })

  it('handles zero balances with positive contributions', () => {
    const result = calculateProjection(
      makeHousehold(65),
      makeBalances(0, 0),
      makeContributions(1000, 1000),
      makeAssumptions(7.0, 2.5),
      35
    )
    expect(result.net_worth_at_retirement).toBeGreaterThan(0)
  })

  it('handles zero return rate', () => {
    const result = calculateProjection(
      makeHousehold(65),
      makeBalances(100000, 0),
      makeContributions(12000, 0),
      makeAssumptions(0.0, 2.5),
      55
    )
    const expected = 100000 + 12000 * 10
    expect(Math.abs(result.net_worth_at_retirement - expected)).toBeLessThan(1)
  })
})

describe('engine: calculateYearlyProjections', () => {
  it('calculates 31 rows for 30 years to retirement', () => {
    const projections = calculateYearlyProjections(
      makeHousehold(65),
      makeBalances(50000, 30000),
      makeContributions(5000, 6000),
      makeAssumptions(7.0, 2.5),
      35,
      2026
    )
    expect(projections.length).toBe(31)
    expect(projections[0].year).toBe(2026)
    expect(projections[0].age).toBe(35)
    expect(projections[30].year).toBe(2056)
    expect(projections[30].age).toBe(65)
    expect(projections[30].total_net_worth).toBeGreaterThan(projections[0].total_net_worth)
  })

  it('respects current_year parameter', () => {
    const projections = calculateYearlyProjections(
      makeHousehold(67),
      makeBalances(100000, 0),
      makeContributions(0, 0),
      makeAssumptions(5.0, 2.0),
      40,
      2030
    )
    expect(projections[0].year).toBe(2030)
    expect(projections[0].age).toBe(40)
    expect(projections[27].year).toBe(2057)
    expect(projections[27].age).toBe(67)
  })

  it('handles zero balances and zero contributions', () => {
    const projections = calculateYearlyProjections(
      makeHousehold(65),
      makeBalances(0, 0),
      makeContributions(0, 0),
      makeAssumptions(7.0, 2.5),
      35,
      2026
    )
    expect(projections.length).toBe(31)
    for (const p of projections) {
      expect(p.total_net_worth).toBe(0)
    }
  })

  it('handles zero return rate accurately', () => {
    const projections = calculateYearlyProjections(
      makeHousehold(65),
      makeBalances(10000, 0),
      makeContributions(12000, 0),
      makeAssumptions(0.0, 2.5),
      55,
      2026
    )
    expect(projections.length).toBe(11)
    expect(projections[0].year).toBe(2026)
    const first = projections[0].rrsp
    const last = projections[10].rrsp
    expect(Math.abs(last - (first + 12000 * 10))).toBeLessThan(1)
  })

  it('handles max age range (1 to 100)', () => {
    const projections = calculateYearlyProjections(
      makeHousehold(100),
      makeBalances(1000, 0),
      makeContributions(0, 0),
      makeAssumptions(7.0, 2.5),
      1,
      2026
    )
    expect(projections.length).toBe(100)
    expect(projections[0].age).toBe(1)
    expect(projections[99].age).toBe(100)
  })
})

describe('engine: calculateSimpleProjection', () => {
  it('calculates simple annual projection', () => {
    const projections = calculateSimpleProjection(100000, 35, 65, 7.0, 2026)
    expect(projections.length).toBe(31)
    expect(projections[0].year).toBe(2026)
    expect(projections[0].age).toBe(35)
    expect(projections[0].portfolioValue).toBe(100000)
    expect(projections[30].portfolioValue).toBeGreaterThan(100000)
  })

  it('returns empty array when zero years to retirement', () => {
    const projections = calculateSimpleProjection(100000, 65, 65, 7.0, 2026)
    expect(projections).toEqual([])
  })

  it('handles zero balance', () => {
    const projections = calculateSimpleProjection(0, 35, 65, 7.0, 2026)
    expect(projections.length).toBe(31)
    for (const p of projections) {
      expect(p.portfolioValue).toBe(0)
    }
  })

  it('handles zero return rate', () => {
    const projections = calculateSimpleProjection(50000, 40, 65, 0.0, 2026)
    expect(projections.length).toBe(26)
    for (const p of projections) {
      expect(p.portfolioValue).toBe(50000)
    }
  })
})

describe('engine: projectPersonAccounts', () => {
  const accounts: Account[] = [
    { id: '1', type: 'RRSP', balance: 50000, annualContribution: 5000 },
    { id: '2', type: 'TFSA', balance: 30000, annualContribution: 6000 },
  ]

  it('projects person accounts in nominal dollars', () => {
    const points = projectPersonAccounts(accounts, 65, 35, 7.0, 2.5, false, 30, 2026)
    expect(points.length).toBe(31)
    expect(points[0].age).toBe(35)
    expect(points[0].RRSP).toBe(50000)
    expect(points[0].TFSA).toBe(30000)
    expect(points[0].Total).toBe(80000)

    const last = points[30]
    expect(last.age).toBe(65)
    expect(last.Total).toBeGreaterThan(80000)
    expect((last.RRSP ?? 0) + (last.TFSA ?? 0)).toBeCloseTo(last.Total, 2)
  })

  it('projects person accounts in real (deflated) dollars', () => {
    const points = projectPersonAccounts(accounts, 65, 35, 7.0, 2.5, true, 30, 2026)
    expect(points.length).toBe(31)
    expect(points[0].age).toBe(35)
    expect(points[0].Total).toBe(80000)

    const nominalPoints = projectPersonAccounts(accounts, 65, 35, 7.0, 2.5, false, 30, 2026)
    expect(points[30].Total).toBeLessThan(nominalPoints[30].Total)
  })

  it('returns empty array when yearsToRetirement <= 0', () => {
    const points = projectPersonAccounts(accounts, 65, 65, 7.0, 2.5, false, 0, 2026)
    expect(points).toEqual([])
  })

  it('reinvests an RRSP refund as an additional TFSA contribution', () => {
    const withoutRefund = projectPersonAccounts(accounts, 65, 35, 7.0, 2.5, false, 30, 2026)
    const withRefund = projectPersonAccounts(accounts, 65, 35, 7.0, 2.5, false, 30, 2026, {
      rrspRefundAnnual: 1500,
    })

    expect(withRefund[30].RRSP).toBeCloseTo(withoutRefund[30].RRSP ?? 0, 2)
    expect(withRefund[30].TFSA!).toBeGreaterThan(withoutRefund[30].TFSA ?? 0)
    expect(withRefund[30].Total!).toBeGreaterThan(withoutRefund[30].Total ?? 0)
  })
})
