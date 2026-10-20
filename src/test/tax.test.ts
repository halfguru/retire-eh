import { describe, it, expect } from 'vitest'
import {
  FEDERAL_BRACKETS_2026,
  QUEBEC_BRACKETS_2026,
  progressiveTax,
  marginalRate,
  combinedMarginalRate,
  computePersonTax,
  computeRetirementTaxSummary,
} from '@/lib/tax'

function expectClose(actual: number, expected: number, precision = 2) {
  expect(actual).toBeCloseTo(expected, precision)
}

describe('progressiveTax', () => {
  it('returns zero for non-positive income', () => {
    expect(progressiveTax(0, FEDERAL_BRACKETS_2026)).toBe(0)
    expect(progressiveTax(-1000, FEDERAL_BRACKETS_2026)).toBe(0)
  })

  it('taxes income inside the first federal bracket at 14%', () => {
    expectClose(progressiveTax(50000, FEDERAL_BRACKETS_2026), 7000)
  })

  it('stacks federal brackets correctly', () => {
    expectClose(progressiveTax(100000, FEDERAL_BRACKETS_2026), 16696.005)
    expectClose(progressiveTax(200000, FEDERAL_BRACKETS_2026), 42315.33)
  })

  it('stacks Quebec brackets correctly', () => {
    expectClose(progressiveTax(100000, QUEBEC_BRACKETS_2026), 16282.75)
  })
})

describe('marginalRate', () => {
  it('returns the federal bracket rate for an income', () => {
    expect(marginalRate(50000, FEDERAL_BRACKETS_2026)).toBe(14)
    expect(marginalRate(60000, FEDERAL_BRACKETS_2026)).toBe(20.5)
    expect(marginalRate(130000, FEDERAL_BRACKETS_2026)).toBe(26)
    expect(marginalRate(200000, FEDERAL_BRACKETS_2026)).toBe(29)
    expect(marginalRate(300000, FEDERAL_BRACKETS_2026)).toBe(33)
  })

  it('returns the Quebec bracket rate for an income', () => {
    expect(marginalRate(50000, QUEBEC_BRACKETS_2026)).toBe(14)
    expect(marginalRate(60000, QUEBEC_BRACKETS_2026)).toBe(19)
    expect(marginalRate(120000, QUEBEC_BRACKETS_2026)).toBe(24)
    expect(marginalRate(200000, QUEBEC_BRACKETS_2026)).toBe(25.75)
  })

  it('combines federal (after abatement) and Quebec rates', () => {
    expectClose(combinedMarginalRate(100000), 20.5 * (1 - 0.165) + 19)
  })
})

describe('computePersonTax', () => {
  it('applies federal and Quebec credits at 100k of ordinary income', () => {
    const result = computePersonTax({
      taxableIncome: 100000,
      age: 40,
      oasReceived: 0,
      eligiblePensionIncome: 0,
    })
    expectClose(result.federal, 12017.93)
    expectClose(result.quebec, 13629.47)
    expectClose(result.total, 25647.4)
    expect(result.oasClawback).toBe(0)
  })

  it('does not claw back OAS below the threshold', () => {
    const result = computePersonTax({
      taxableIncome: 90000,
      age: 67,
      oasReceived: 9024,
      eligiblePensionIncome: 0,
    })
    expect(result.oasClawback).toBe(0)
  })

  it('claws back 15% of income above the OAS threshold', () => {
    const result = computePersonTax({
      taxableIncome: 120000,
      age: 67,
      oasReceived: 9024,
      eligiblePensionIncome: 0,
    })
    expectClose(result.oasClawback, 0.15 * (120000 - 95323))
  })

  it('caps the OAS clawback at the OAS received', () => {
    const result = computePersonTax({
      taxableIncome: 200000,
      age: 67,
      oasReceived: 9024,
      eligiblePensionIncome: 0,
    })
    expect(result.oasClawback).toBe(9024)
  })

  it('phases out Quebec age and retirement amounts above the reduction threshold', () => {
    const lower = computePersonTax({
      taxableIncome: 50000,
      age: 65,
      oasReceived: 0,
      eligiblePensionIncome: 70000,
    })
    const higher = computePersonTax({
      taxableIncome: 51000,
      age: 65,
      oasReceived: 0,
      eligiblePensionIncome: 70000,
    })
    expect(higher.quebec - lower.quebec).toBeGreaterThan(160)
  })

  it('fully phases out Quebec age and retirement amounts at higher income', () => {
    const lower = computePersonTax({
      taxableIncome: 100000,
      age: 65,
      oasReceived: 0,
      eligiblePensionIncome: 70000,
    })
    const higher = computePersonTax({
      taxableIncome: 101000,
      age: 65,
      oasReceived: 0,
      eligiblePensionIncome: 70000,
    })
    expectClose(higher.quebec - lower.quebec, 190)
  })

  it('deducts the OAS clawback from income before calculating tax', () => {
    const withClawback = computePersonTax({
      taxableIncome: 120000,
      age: 67,
      oasReceived: 9024,
      eligiblePensionIncome: 0,
    })
    const reducedIncome = computePersonTax({
      taxableIncome: 120000 - withClawback.oasClawback,
      age: 67,
      oasReceived: 0,
      eligiblePensionIncome: 0,
    })
    expectClose(withClawback.federal, reducedIncome.federal)
    expectClose(withClawback.quebec, reducedIncome.quebec)
  })

  it('reduces tax at 65+ with age and pension credits', () => {
    const younger = computePersonTax({
      taxableIncome: 100000,
      age: 64,
      oasReceived: 0,
      eligiblePensionIncome: 70000,
    })
    const older = computePersonTax({
      taxableIncome: 100000,
      age: 65,
      oasReceived: 0,
      eligiblePensionIncome: 70000,
    })
    expect(older.total).toBeLessThan(younger.total)
  })
})

describe('computeRetirementTaxSummary', () => {
  const people = [
    { name: 'Simon', ageAtRetirement: 65, pension: 0, cpp: 18100, oas: 9024 },
    { name: 'Jessie', ageAtRetirement: 66, pension: 70000, cpp: 18100, oas: 9024 },
  ]

  it('taxes the RRSP share of withdrawals and leaves TFSA withdrawals tax-free', () => {
    const summary = computeRetirementTaxSummary({
      people,
      rrspAtRetirement: 750000,
      tfsaAtRetirement: 250000,
      portfolioWithdrawal: 40000,
    })
    expectClose(summary.taxableWithdrawal, 30000)
    expectClose(summary.taxFreeWithdrawal, 10000)
    expectClose(summary.guaranteedIncome, 124248)
    expectClose(summary.preTaxIncome, 164248)
  })

  it('allocates taxable RRIF withdrawals to the lower-income spouse first', () => {
    const summary = computeRetirementTaxSummary({
      people,
      rrspAtRetirement: 1000000,
      tfsaAtRetirement: 0,
      portfolioWithdrawal: 60000,
    })
    const simon = summary.perPerson[0]
    const jessie = summary.perPerson[1]
    expect(simon.rrifWithdrawal).toBeGreaterThan(jessie.rrifWithdrawal)
    expectClose(summary.taxableWithdrawal, 60000)
  })

  it('derives after-tax income and an effective rate from estimated tax', () => {
    const summary = computeRetirementTaxSummary({
      people,
      rrspAtRetirement: 1000000,
      tfsaAtRetirement: 0,
      portfolioWithdrawal: 60000,
    })
    expect(summary.totalTax).toBeGreaterThan(0)
    expectClose(summary.afterTaxIncome, summary.preTaxIncome - summary.totalTax)
    expect(summary.averageTaxRate).toBeGreaterThan(0)
    expect(summary.averageTaxRate).toBeLessThan(100)
    expect(summary.effectiveRrspTaxRate).toBe(summary.averageTaxRate)
  })

  it('handles a portfolio with no RRSP without dividing by zero', () => {
    const summary = computeRetirementTaxSummary({
      people,
      rrspAtRetirement: 0,
      tfsaAtRetirement: 500000,
      portfolioWithdrawal: 20000,
    })
    expect(summary.taxableWithdrawal).toBe(0)
    expectClose(summary.taxFreeWithdrawal, 20000)
    expect(summary.perPerson.every(p => p.rrifWithdrawal === 0)).toBe(true)
  })
})
