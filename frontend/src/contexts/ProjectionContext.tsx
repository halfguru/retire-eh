import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePeople } from './PeopleContext'
import { useAssumptions } from './AssumptionsContext'
import { useProjection } from '@/hooks/useProjection'

import type { ProjectionDataPoint } from '@/types/projection'

interface ProjectionContextValueTyped {
  wasmLoaded: boolean
  wasmError: string | null
  projectionData: ProjectionDataPoint[]
  conservativeProjectionData: ProjectionDataPoint[]
  optimisticProjectionData: ProjectionDataPoint[]
  realProjectionData: ProjectionDataPoint[]
  currentProjectionData: ProjectionDataPoint[]
  householdRetirementAge: number
  yearsToRetirement: number
  minCurrentAge: number
  totalAnnualIncome: number
  totalAnnualPension: number
  totalAnnualCpp: number
  totalAnnualOas: number
  totalPortfolio: number
  totalAnnualContributions: number
}

const ProjectionContext = createContext<ProjectionContextValueTyped | null>(null)

// Each person accumulates to their own retirement age; after that their
// portfolio is frozen (no more contributions, pre-retirement drawdown is out
// of scope here). We project every person on their own timeline and sum the
// result by age so contributions stop per person, not at a single household age.
function buildCombinedProjection(
  people: { currentAge: number; retirementAge: number; accounts: import('@/types/person').Account[] }[],
  calculateProjection: (
    accounts: import('@/types/person').Account[],
    retirementAge: number,
    baseAge: number,
    expectedReturn: number,
    inflationRate: number,
    showRealValues: boolean,
    yearsToRetirement: number
  ) => ProjectionDataPoint[],
  expectedReturn: number,
  inflationRate: number,
  showRealValues: boolean,
  householdRetirementAge: number
): ProjectionDataPoint[] {
  if (people.length === 0) return []

  const baseAge = Math.min(...people.map(p => p.currentAge))
  const endAge = householdRetirementAge
  const currentYear = new Date().getFullYear()

  const perPerson = people.map(p =>
    calculateProjection(p.accounts, p.retirementAge, p.currentAge, expectedReturn, inflationRate, showRealValues, p.retirementAge - p.currentAge)
  )

  const combined: ProjectionDataPoint[] = []
  for (let age = baseAge; age <= endAge; age++) {
    let total = 0
    let rrsp = 0
    let tfsa = 0
    let hasRrsp = false
    let hasTfsa = false

    people.forEach((p, i) => {
      const proj = perPerson[i]
      if (proj.length === 0) return
      const point = age < p.currentAge
        ? proj[0]
        : age > p.retirementAge
          ? proj[proj.length - 1]
          : proj[age - p.currentAge]
      total += point.Total ?? 0
      if (point.RRSP !== undefined) { rrsp += point.RRSP; hasRrsp = true }
      if (point.TFSA !== undefined) { tfsa += point.TFSA; hasTfsa = true }
    })

    combined.push({
      year: currentYear + (age - baseAge),
      age,
      RRSP: hasRrsp ? rrsp : undefined,
      TFSA: hasTfsa ? tfsa : undefined,
      Total: total
    })
  }
  return combined
}

export function ProjectionProvider({ children }: { children: ReactNode }) {
  const { people } = usePeople()
  const { expectedReturn, inflationRate, showRealValues } = useAssumptions()
  const { wasmLoaded, wasmError, calculateProjection } = useProjection()

  const householdRetirementAge = people.length ? Math.max(...people.map(p => p.retirementAge)) : 0
  const minCurrentAge = people.length ? Math.min(...people.map(p => p.currentAge)) : 0
  const yearsToRetirement = people.length ? householdRetirementAge - minCurrentAge : 0
  const totalAnnualIncome = people.reduce((sum, p) => sum + (p.annualIncome || 0), 0)
  const totalAnnualPension = people.reduce((sum, p) => sum + (p.annualPension || 0), 0)
  const totalAnnualCpp = people.reduce((sum, p) => sum + (p.annualCpp || 0), 0)
  const totalAnnualOas = people.reduce((sum, p) => {
    const ageAtRetirement = p.currentAge + yearsToRetirement
    return sum + (ageAtRetirement >= 65 ? 9024 : 0)
  }, 0)
  const allAccounts = people.flatMap(p => p.accounts)
  const totalPortfolio = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalAnnualContributions = allAccounts.reduce((sum, acc) => sum + (acc.annualContribution || 0), 0)

  const projectionData = useMemo(
    () => buildCombinedProjection(people, calculateProjection, expectedReturn, inflationRate, showRealValues, householdRetirementAge),
    [people, calculateProjection, expectedReturn, inflationRate, showRealValues, householdRetirementAge]
  )
  const conservativeProjectionData = useMemo(
    () => buildCombinedProjection(people, calculateProjection, Math.max(0, expectedReturn - 2), inflationRate, showRealValues, householdRetirementAge),
    [people, calculateProjection, expectedReturn, inflationRate, showRealValues, householdRetirementAge]
  )
  const optimisticProjectionData = useMemo(
    () => buildCombinedProjection(people, calculateProjection, expectedReturn + 2, inflationRate, showRealValues, householdRetirementAge),
    [people, calculateProjection, expectedReturn, inflationRate, showRealValues, householdRetirementAge]
  )
  const realProjectionData = useMemo(
    () => buildCombinedProjection(people, calculateProjection, expectedReturn, inflationRate, true, householdRetirementAge),
    [people, calculateProjection, expectedReturn, inflationRate, householdRetirementAge]
  )

  return (
    <ProjectionContext.Provider value={{
      wasmLoaded, wasmError,
      projectionData, conservativeProjectionData, optimisticProjectionData,
      realProjectionData, currentProjectionData: projectionData,
      householdRetirementAge, yearsToRetirement, minCurrentAge,
      totalAnnualIncome, totalAnnualPension, totalAnnualCpp, totalAnnualOas,
      totalPortfolio, totalAnnualContributions,
    }}>
      {children}
    </ProjectionContext.Provider>
  )
}

export function useProjectionContext() {
  const ctx = useContext(ProjectionContext)
  if (!ctx) throw new Error('useProjectionContext must be used within ProjectionProvider')
  return ctx
}
