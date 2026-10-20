import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePeople } from './PeopleContext'
import { useAssumptions } from './AssumptionsContext'
import { projectPersonAccounts } from '@/lib/engine'
import { getCppIncomeAtAge, getGiftTotal, getOasIncomeAtAge } from '@/lib/calculations'
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
  // Align people by years from today, not by age. Household members are
  // different ages, so age 65 for one person is a different calendar year than
  // age 65 for another.
  for (let offset = 0; offset <= endAge - baseAge; offset++) {
    const age = baseAge + offset
    let total = 0
    let rrsp = 0
    let tfsa = 0
    let hasRrsp = false
    let hasTfsa = false

    people.forEach((_, i) => {
      const proj = perPerson[i]
      if (proj.length === 0) return
      const lastIndex = proj.length - 1
      const point = proj[Math.min(offset, lastIndex)]

      // A frozen portfolio still loses purchasing power to inflation. The
      // per-person projection stops deflating at that person's retirement age,
      // so continue deflating here until the household retirement age.
      const frozenDeflation = showRealValues && offset > lastIndex
        ? Math.pow(1 + inflationRate / 100, offset - lastIndex)
        : 1
      const pointTotal = (point.Total ?? 0) / frozenDeflation
      const pointRrsp = point.RRSP !== undefined ? point.RRSP / frozenDeflation : undefined
      const pointTfsa = point.TFSA !== undefined ? point.TFSA / frozenDeflation : undefined

      total += pointTotal
      if (pointRrsp !== undefined) { rrsp += pointRrsp; hasRrsp = true }
      if (pointTfsa !== undefined) { tfsa += pointTfsa; hasTfsa = true }
    })

    combined.push({
      year: currentYear + offset,
      age,
      RRSP: hasRrsp ? rrsp : undefined,
      TFSA: hasTfsa ? tfsa : undefined,
      Total: total
    })
  }
  return combined
}

function scaleRetirementTaxSummary(
  summary: RetirementTaxSummary,
  factor: number,
): RetirementTaxSummary {
  if (factor === 1) return summary
  return {
    ...summary,
    perPerson: summary.perPerson.map(p => ({
      ...p,
      pension: p.pension * factor,
      cpp: p.cpp * factor,
      oas: p.oas * factor,
      rrifWithdrawal: p.rrifWithdrawal * factor,
      taxableIncome: p.taxableIncome * factor,
      federal: p.federal * factor,
      quebec: p.quebec * factor,
      oasClawback: p.oasClawback * factor,
      total: p.total * factor,
    })),
    guaranteedIncome: summary.guaranteedIncome * factor,
    portfolioWithdrawal: summary.portfolioWithdrawal * factor,
    taxableWithdrawal: summary.taxableWithdrawal * factor,
    taxFreeWithdrawal: summary.taxFreeWithdrawal * factor,
    totalTax: summary.totalTax * factor,
    oasClawback: summary.oasClawback * factor,
    preTaxIncome: summary.preTaxIncome * factor,
    afterTaxIncome: summary.afterTaxIncome * factor,
  }
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
    return sum + getOasIncomeAtAge(OAS_MAX_ANNUAL_2026, p.oasStartAge, ageAtRetirement)
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
    if (people.length === 0 || realProjectionData.length === 0) return null

    const incomePeople = people.map(p => {
      const ageAtRetirement = p.currentAge + yearsToRetirement
      return {
        name: p.name,
        ageAtRetirement,
        pension: p.annualPension || 0,
        cpp: getCppIncomeAtAge(p.annualCpp, p.cppStartAge, ageAtRetirement),
        oas: getOasIncomeAtAge(OAS_MAX_ANNUAL_2026, p.oasStartAge, ageAtRetirement),
      }
    })

    // Brackets and credits are fixed to 2026, so tax must be computed in
    // today's dollars. Converting the dollar results afterwards keeps the
    // effective rate identical in real and nominal display modes.
    const lastPoint = realProjectionData[realProjectionData.length - 1]
    const giftTotal = getGiftTotal(plannedGifts, yearsToRetirement, true, inflationRate)
    const portfolioWithdrawal = Math.max(0, (lastPoint.Total ?? 0) - giftTotal) * (withdrawalRate / 100)
    const summary = computeRetirementTaxSummary({
      people: incomePeople,
      rrspAtRetirement: lastPoint.RRSP ?? 0,
      tfsaAtRetirement: lastPoint.TFSA ?? 0,
      portfolioWithdrawal,
    })

    if (showRealValues) return summary
    const inflationFactor = Math.pow(1 + inflationRate / 100, Math.max(0, yearsToRetirement))
    return scaleRetirementTaxSummary(summary, inflationFactor)
  }, [people, realProjectionData, yearsToRetirement, showRealValues, inflationRate, withdrawalRate, plannedGifts])

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
