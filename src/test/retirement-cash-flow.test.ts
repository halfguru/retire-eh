import { describe, it, expect } from 'vitest'
import { buildRetirementCashFlow } from '@/lib/retirementCashFlow'

const person = {
  name: 'You',
  currentAge: 65,
  annualPension: 0,
  annualCpp: 18000,
  cppStartAge: 65,
  oasStartAge: 65,
}

const baseParams = {
  people: [person],
  rrspAtRetirement: 100000,
  tfsaAtRetirement: 0,
  expectedReturnPct: 7,
  inflationPct: 2.5,
  withdrawalRatePct: 4,
  householdRetirementAge: 65,
  yearsToRetirement: 0,
  endAge: 95,
  currentYear: 2026,
}

describe('buildRetirementCashFlow', () => {
  it('builds a row for every year from retirement to the end age', () => {
    const rows = buildRetirementCashFlow(baseParams)
    expect(rows).toHaveLength(31)
    expect(rows[0].age).toBe(65)
    expect(rows[0].year).toBe(2026)
    expect(rows.at(-1)!.age).toBe(95)
  })

  it('includes CPP, OAS, and the constant portfolio withdrawal', () => {
    const [first] = buildRetirementCashFlow(baseParams)
    expect(first.cpp).toBe(18000)
    expect(first.oas).toBe(9024)
    expect(first.portfolioWithdrawal).toBe(4000)
    expect(first.rrspWithdrawal).toBe(4000)
    expect(first.tfsaWithdrawal).toBe(0)
    expect(first.grossIncome).toBe(31024)
    expect(first.tax).toBeGreaterThan(0)
    expect(first.afterTaxIncome).toBeCloseTo(first.grossIncome - first.tax, 5)
  })

  it('compounds the remaining portfolio at the real return rate', () => {
    const [first] = buildRetirementCashFlow(baseParams)
    const realReturn = 1.07 / 1.025 - 1
    expect(first.portfolioEnd).toBeCloseTo((100000 - 4000) * (1 + realReturn), 1)
  })

  it('waits until the selected start age for CPP and OAS', () => {
    const rows = buildRetirementCashFlow({
      ...baseParams,
      people: [{ ...person, cppStartAge: 70, oasStartAge: 70 }],
    })
    expect(rows[0].cpp).toBe(0)
    expect(rows[0].oas).toBe(0)
    expect(rows[5].age).toBe(70)
    expect(rows[5].cpp).toBeCloseTo(25560, 5)
    expect(rows[5].oas).toBeCloseTo(12272.64, 5)
  })

  it('uses each person’s own age for benefit timing', () => {
    const rows = buildRetirementCashFlow({
      ...baseParams,
      people: [{ ...person, currentAge: 68, cppStartAge: 70, oasStartAge: 70, annualCpp: 0 }],
      householdRetirementAge: 70,
      yearsToRetirement: 2,
      endAge: 70,
    })
    expect(rows[0].age).toBe(70)
    expect(rows[0].oas).toBeCloseTo(12272.64, 5)
  })

  it('inflates future-dollar values year by year while keeping the real plan', () => {
    const realRows = buildRetirementCashFlow(baseParams)
    const nominalRows = buildRetirementCashFlow({ ...baseParams, showRealValues: false })
    const ratio = nominalRows[10].grossIncome / realRows[10].grossIncome
    expect(ratio).toBeCloseTo(Math.pow(1.025, 10), 5)
  })
})
