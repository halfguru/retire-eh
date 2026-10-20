import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePeople } from './PeopleContext'
import { useAssumptions } from './AssumptionsContext'
import { projectPersonAccounts } from '@/lib/engine'
import { getCppIncomeAtAge, getGiftTotal } from '@/lib/calculations'
import { computeRetirementTaxSummary, OAS_MAX_ANNUAL_2026, type RetirementTaxSummary } from '@/lib/tax'
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
  retirementTax: RetirementTaxSummary | null
}

const ProjectionContext = createContext<ProjectionContextValueTyped | null>(null)

// Each person accumulates to their own retirement age; after that their
// portfolio is frozen (no more contributions, pre-retirement drawdown is out
// of scope here). We project every person on their own timeline and sum the
// result by age so contributions stop per person, not at a single household age.
function buildCombinedProjection(
  people: { currentAge: number; retirementAge: number; accounts: import('@/types/person').Account[] }[],
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
    projectPersonAccounts(
      p.accounts,
      p.retirementAge,
      p.currentAge,
      expectedReturn,
      inflationRate,
      showRealValues,
      p.retirementAge - p.currentAge,
      currentYear
    )
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
  const { expectedReturn, inflationRate, showRealValues, withdrawalRate, plannedGifts } = useAssumptions()

  const householdRetirementAge = people.length ? Math.max(...people.map(p => p.retirementAge)) : 0
  const minCurrentAge = people.length ? Math.min(...people.map(p => p.currentAge)) : 0
  const yearsToRetirement = people.length ? householdRetirementAge - minCurrentAge : 0
  const totalAnnualIncome = people.reduce((sum, p) => sum + (p.annualIncome || 0), 0)
  const totalAnnualPension = people.reduce((sum, p) => sum + (p.annualPension || 0), 0)
  const totalAnnualCpp = people.reduce((sum, p) => {
    const ageAtHouseholdRetirement = p.currentAge + yearsToRetirement
    return sum + getCppIncomeAtAge(p.annualCpp, p.cppStartAge, ageAtHouseholdRetirement)
  }, 0)
  const totalAnnualOas = people.reduce((sum, p) => {
    const ageAtRetirement = p.currentAge + yearsToRetirement
    return sum + (ageAtRetirement >= 65 ? OAS_MAX_ANNUAL_2026 : 0)
  }, 0)
  const allAccounts = people.flatMap(p => p.accounts)
  const totalPortfolio = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalAnnualContributions = allAccounts.reduce((sum, acc) => sum + (acc.annualContribution || 0), 0)

  const projectionData = useMemo(
    () => buildCombinedProjection(people, expectedReturn, inflationRate, showRealValues, householdRetirementAge),
    [people, expectedReturn, inflationRate, showRealValues, householdRetirementAge]
  )
  const conservativeProjectionData = useMemo(
    () => buildCombinedProjection(people, Math.max(0, expectedReturn - 2), inflationRate, showRealValues, householdRetirementAge),
    [people, expectedReturn, inflationRate, showRealValues, householdRetirementAge]
  )
  const optimisticProjectionData = useMemo(
    () => buildCombinedProjection(people, expectedReturn + 2, inflationRate, showRealValues, householdRetirementAge),
    [people, expectedReturn, inflationRate, showRealValues, householdRetirementAge]
  )
  const realProjectionData = useMemo(
    () => buildCombinedProjection(people, expectedReturn, inflationRate, true, householdRetirementAge),
    [people, expectedReturn, inflationRate, householdRetirementAge]
  )

  const retirementTax = useMemo(() => {
    if (people.length === 0 || projectionData.length === 0) return null

    const inflationFactor = showRealValues
      ? 1
      : Math.pow(1 + inflationRate / 100, Math.max(0, yearsToRetirement))

    const incomePeople = people.map(p => {
      const ageAtRetirement = p.currentAge + yearsToRetirement
      return {
        name: p.name,
        ageAtRetirement,
        pension: (p.annualPension || 0) * inflationFactor,
        cpp: getCppIncomeAtAge(p.annualCpp, p.cppStartAge, ageAtRetirement) * inflationFactor,
        oas: (ageAtRetirement >= 65 ? OAS_MAX_ANNUAL_2026 : 0) * inflationFactor,
      }
    })

    const lastPoint = projectionData[projectionData.length - 1]
    const giftTotal = getGiftTotal(plannedGifts, yearsToRetirement, showRealValues, inflationRate)
    const portfolioWithdrawal = Math.max(0, (lastPoint.Total ?? 0) - giftTotal) * (withdrawalRate / 100)

    return computeRetirementTaxSummary({
      people: incomePeople,
      rrspAtRetirement: lastPoint.RRSP ?? 0,
      tfsaAtRetirement: lastPoint.TFSA ?? 0,
      portfolioWithdrawal,
    })
  }, [people, projectionData, yearsToRetirement, showRealValues, inflationRate, withdrawalRate, plannedGifts])

  return (
    <ProjectionContext.Provider value={{
      wasmLoaded: true,
      wasmError: null,
      projectionData, conservativeProjectionData, optimisticProjectionData,
      realProjectionData, currentProjectionData: projectionData,
      householdRetirementAge, yearsToRetirement, minCurrentAge,
      totalAnnualIncome, totalAnnualPension, totalAnnualCpp, totalAnnualOas,
      totalPortfolio, totalAnnualContributions, retirementTax,
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
