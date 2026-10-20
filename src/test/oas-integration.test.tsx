import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { PeopleProvider } from '@/contexts/PeopleContext'
import { AssumptionsProvider } from '@/contexts/AssumptionsContext'
import { ProjectionProvider, useProjectionContext } from '@/contexts/ProjectionContext'
import { OAS_MAX_ANNUAL_2026 } from '@/lib/tax'

const person = {
  id: '1',
  name: 'Deferred OAS',
  currentAge: 68,
  retirementAge: 70,
  annualIncome: 0,
  annualPension: 0,
  annualCpp: 0,
  cppStartAge: 65,
  oasStartAge: 70,
  accounts: [
    { id: '1-1', type: 'RRSP', balance: 100000, annualContribution: 0 },
  ],
}

const expectedOas = OAS_MAX_ANNUAL_2026 * 1.36

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <PeopleProvider>
      <AssumptionsProvider>
        <ProjectionProvider>{children}</ProjectionProvider>
      </AssumptionsProvider>
    </PeopleProvider>
  )
}

describe('OAS start age in the projection', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('people', JSON.stringify([person]))
  })

  it('uses the deferred OAS amount at retirement and in the tax estimate', () => {
    const { result } = renderHook(() => useProjectionContext(), { wrapper })

    expect(result.current.totalAnnualOas).toBeCloseTo(expectedOas, 5)
    expect(result.current.retirementTax).not.toBeNull()
    expect(result.current.retirementTax!.perPerson[0].oas).toBeCloseTo(expectedOas, 5)
  })

  it('does not count OAS before the chosen start age', () => {
    localStorage.setItem('people', JSON.stringify([{ ...person, currentAge: 63, retirementAge: 65 }]))
    const { result } = renderHook(() => useProjectionContext(), { wrapper })

    expect(result.current.totalAnnualOas).toBe(0)
    expect(result.current.retirementTax!.perPerson[0].oas).toBe(0)
  })
})
