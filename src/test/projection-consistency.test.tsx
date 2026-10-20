import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { PeopleProvider } from '@/contexts/PeopleContext'
import { AssumptionsProvider, useAssumptions } from '@/contexts/AssumptionsContext'
import { ProjectionProvider, useProjectionContext } from '@/contexts/ProjectionContext'
import { calculateRetirementGoal } from '@/lib/calculations'
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
}

function goalFor(
  showRealValues: boolean,
  data: ProjectionDataPoint[],
  yearsToRetirement: number,
  annualPension: number,
  effectiveTaxRate: number,
) {
  return calculateRetirementGoal({
    currentProjectionData: data,
    annualIncome: 230000,
    annualPension,
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
    )

    act(() => result.current.assumptions.setShowRealValues(false))

    const nominalProjection = result.current.projection
    const nominalGoal = goalFor(
      false,
      nominalProjection.currentProjectionData,
      nominalProjection.yearsToRetirement,
      nominalProjection.totalAnnualPension + nominalProjection.totalAnnualCpp + nominalProjection.totalAnnualOas,
      nominalProjection.retirementTax?.effectiveRrspTaxRate ?? 0,
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
