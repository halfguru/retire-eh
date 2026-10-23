import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { PeopleProvider } from '@/contexts/PeopleContext'
import { AssumptionsProvider, useAssumptions } from '@/contexts/AssumptionsContext'
import { ProjectionProvider, buildCombinedProjection, useProjectionContext } from '@/contexts/ProjectionContext'
import { buildGuaranteedIncomeSchedule, calculateRetirementGoal, levelizeGuaranteedIncome } from '@/lib/calculations'
import type { ProjectionDataPoint } from '@/types/projection'

const people = [
  {
    id: '1',
    name: 'Simon',
    currentAge: 34,
    retirementAge: 65,
    annualIncome: 140000,
    annualPension: 0,
    annualCpp: 18100,
    cppStartAge: 65,
    accounts: [
      { id: '1-1', type: 'RRSP', balance: 48000, annualContribution: 0 },
      { id: '1-2', type: 'TFSA', balance: 29000, annualContribution: 0 },
    ],
  },
  {
    id: '2',
    name: 'Jessie',
    currentAge: 35,
    retirementAge: 58,
    annualIncome: 90000,
    annualPension: 70000,
    annualCpp: 18100,
    cppStartAge: 65,
    accounts: [
      { id: '2-1', type: 'RRSP', balance: 30000, annualContribution: 0 },
      { id: '2-2', type: 'TFSA', balance: 80000, annualContribution: 0 },
    ],
  },
]

const gifts = [
  { amount: 100000, age: 65 },
  { amount: 100000, age: 65 },
]

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <PeopleProvider>
      <AssumptionsProvider>
        <ProjectionProvider>{children}</ProjectionProvider>
      </AssumptionsProvider>
    </PeopleProvider>
  )
}

function seedStorage() {
  localStorage.clear()
  localStorage.setItem('people', JSON.stringify(people))
  localStorage.setItem('expectedReturn', '7')
  localStorage.setItem('inflationRate', '2.5')
  localStorage.setItem('replacementRate', '60')
  localStorage.setItem('withdrawalRate', '4')
  localStorage.setItem('showRealValues', 'true')
  localStorage.setItem('plannedGifts', JSON.stringify(gifts))
  localStorage.setItem('workingMarginalTaxRate', '30')
  localStorage.setItem('reinvestRrspRefund', 'false')
}

function goalFor(
  showRealValues: boolean,
  data: ProjectionDataPoint[],
  yearsToRetirement: number,
  annualPension: number,
  effectiveTaxRate: number,
  guaranteedIncomeSchedule: number[] = [],
) {
  return calculateRetirementGoal({
    currentProjectionData: data,
    annualIncome: 230000,
    annualPension,
    guaranteedIncomeSchedule,
    replacementRate: 60,
    withdrawalRate: 4,
    yearsToRetirement,
    expectedReturn: 7,
    inflationRate: 2.5,
    currentAnnualContributions: 0,
    currentPortfolio: 187000,
    showRealValues,
    plannedGifts: gifts,
    effectiveTaxRate,
  })
}

describe('projection: real vs nominal consistency', () => {
  beforeEach(seedStorage)

  it('keeps goal progress and effective tax rate consistent when toggling dollars', () => {
    const { result } = renderHook(() => ({
      assumptions: useAssumptions(),
      projection: useProjectionContext(),
    }), { wrapper })

    const realProjection = result.current.projection
    const realGoal = goalFor(
      true,
      realProjection.currentProjectionData,
      realProjection.yearsToRetirement,
      realProjection.totalAnnualPension + realProjection.totalAnnualCpp + realProjection.totalAnnualOas,
      realProjection.retirementTax?.effectiveRrspTaxRate ?? 0,
      realProjection.guaranteedIncomeSchedule,
    )

    act(() => result.current.assumptions.setShowRealValues(false))

    const nominalProjection = result.current.projection
    const nominalGoal = goalFor(
      false,
      nominalProjection.currentProjectionData,
      nominalProjection.yearsToRetirement,
      nominalProjection.totalAnnualPension + nominalProjection.totalAnnualCpp + nominalProjection.totalAnnualOas,
      nominalProjection.retirementTax?.effectiveRrspTaxRate ?? 0,
      nominalProjection.guaranteedIncomeSchedule,
    )

    const realEnd = realProjection.currentProjectionData.at(-1)!.Total!
    const nominalEnd = nominalProjection.currentProjectionData.at(-1)!.Total!
    expect(nominalEnd / realEnd).toBeCloseTo(Math.pow(1.025, realProjection.yearsToRetirement), 1)

    expect(nominalProjection.retirementTax!.effectiveRrspTaxRate)
      .toBeCloseTo(realProjection.retirementTax!.effectiveRrspTaxRate, 5)

    expect(nominalGoal.afterTaxProgress).toBeCloseTo(realGoal.afterTaxProgress, 1)
    expect(nominalGoal.progress).toBeCloseTo(realGoal.progress, 1)
  })
})

describe('projection: early retiree portfolio', () => {
  const people = [
    {
      currentAge: 35,
      retirementAge: 58,
      accounts: [{ id: 'early', type: 'TFSA' as const, balance: 100000, annualContribution: 0 }],
    },
    {
      currentAge: 35,
      retirementAge: 65,
      accounts: [],
    },
  ]

  it('keeps compounding after the early retiree stops contributing', () => {
    const data = buildCombinedProjection(people, 7, 2.5, false, 65, 30, false)
    const last = data.at(-1)!
    expect(last.age).toBe(65)
    const monthlyGrowth = Math.pow(1 + 0.07 / 12, 30 * 12)
    expect(last.Total).toBeCloseTo(100000 * monthlyGrowth, 0)
  })

  it('uses real growth in real-dollar mode', () => {
    const data = buildCombinedProjection(people, 7, 2.5, true, 65, 30, false)
    const last = data.at(-1)!
    const nominalGrowth = Math.pow(1 + 0.07 / 12, 30 * 12)
    const expected = 100000 * nominalGrowth / Math.pow(1.025, 30)
    expect(last.Total).toBeCloseTo(expected, 0)
  })
})

describe('goal: delayed CPP and OAS', () => {
  const person = {
    currentAge: 60,
    retirementAge: 65,
    annualPension: 0,
    annualCpp: 18000,
    cppStartAge: 70,
    oasStartAge: 70,
    accounts: [],
  }

  const schedule = buildGuaranteedIncomeSchedule({
    people: [person],
    householdRetirementAge: 65,
    yearsToRetirement: 5,
  })

  it('captures benefits that start after retirement', () => {
    expect(schedule[0]).toBe(0)
    expect(schedule[5]).toBeGreaterThan(0)

    const levelized = levelizeGuaranteedIncome(schedule, 4)
    expect(levelized).toBeGreaterThan(0)
    expect(levelized).toBeLessThan(schedule[5])
  })

  it('reduces the required portfolio compared with ignoring delayed benefits', () => {
    const data = buildCombinedProjection([person], 7, 2.5, true, 65, 30, false)
    const base = {
      currentProjectionData: data,
      annualIncome: 100000,
      annualPension: 0,
      replacementRate: 70,
      withdrawalRate: 4,
      yearsToRetirement: 5,
      expectedReturn: 7,
      inflationRate: 2.5,
      currentAnnualContributions: 0,
      currentPortfolio: 0,
      showRealValues: true,
    }

    const withoutDelayed = calculateRetirementGoal(base)
    const withDelayed = calculateRetirementGoal({
      ...base,
      guaranteedIncomeSchedule: schedule,
    })

    expect(withDelayed.levelizedGuaranteedIncome).toBeGreaterThan(0)
    expect(withDelayed.requiredPortfolio).toBeLessThan(withoutDelayed.requiredPortfolio)
  })
})

describe('projection: RRSP refund reinvestment', () => {
  function seedRefundPlan() {
    localStorage.clear()
    localStorage.setItem('people', JSON.stringify([{
      id: 'refund-1',
      name: 'Contributor',
      currentAge: 35,
      retirementAge: 65,
      annualIncome: 100000,
      annualPension: 0,
      annualCpp: 0,
      cppStartAge: 65,
      oasStartAge: 65,
      accounts: [{ id: 'refund-rrsp', type: 'RRSP', balance: 0, annualContribution: 10000 }],
    }]))
    localStorage.setItem('expectedReturn', '7')
    localStorage.setItem('inflationRate', '2.5')
    localStorage.setItem('replacementRate', '70')
    localStorage.setItem('withdrawalRate', '4')
    localStorage.setItem('showRealValues', 'true')
    localStorage.setItem('plannedGifts', '[]')
    localStorage.setItem('workingMarginalTaxRate', '30')
    localStorage.setItem('reinvestRrspRefund', 'false')
  }

  it('credits the estimated refund to a TFSA when enabled', () => {
    seedRefundPlan()
    const { result } = renderHook(() => ({
      assumptions: useAssumptions(),
      projection: useProjectionContext(),
    }), { wrapper })

    const before = result.current.projection.realProjectionData.at(-1)!.TFSA ?? 0
    expect(before).toBe(0)

    act(() => result.current.assumptions.setReinvestRrspRefund(true))
    const after = result.current.projection.realProjectionData.at(-1)!.TFSA ?? 0

    expect(after).toBeGreaterThan(0)
    expect(result.current.projection.realProjectionData.at(-1)!.RRSP)
      .toBeGreaterThan(0)
  })
})
