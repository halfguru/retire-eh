import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePeople } from './PeopleContext'
import { useAssumptions } from './AssumptionsContext'
import { projectPersonAccounts } from '@/lib/engine'
import { buildGuaranteedIncomeSchedule, getCppIncomeAtAge, getGiftTotal, getOasIncomeAtAge } from '@/lib/calculations'
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
  guaranteedIncomeSchedule: number[]
  totalPortfolio: number
  totalAnnualContributions: number
  retirementTax: RetirementTaxSummary | null
}

const ProjectionContext = createContext<ProjectionContextValueTyped | null>(null)

// Each person accumulates to their own retirement age. After that their
// portfolio keeps compounding (no more contributions; pre-retirement drawdown
// is out of scope here). We project every person on their own timeline and sum
// the result by age so contributions stop per person, not at a single
// household age.
export function buildCombinedProjection(
  people: { currentAge: number; retirementAge: number; accounts: import('@/types/person').Account[] }[],
  expectedReturn: number,
  inflationRate: number,
  showRealValues: boolean,
  householdRetirementAge: number,
  workingMarginalTaxRate: number,
  reinvestRrspRefund: boolean,
): ProjectionDataPoint[] {
  if (people.length === 0) return []

  const baseAge = Math.min(...people.map(p => p.currentAge))
  const endAge = householdRetirementAge
  const currentYear = new Date().getFullYear()

  const perPerson = people.map(p => {
    const rrspContribution = p.accounts
      .filter(account => account.type === 'RRSP')
      .reduce((sum, account) => sum + (account.annualContribution || 0), 0)
    const rrspRefundAnnual = reinvestRrspRefund
      ? rrspContribution * (workingMarginalTaxRate / 100)
      : 0

    return projectPersonAccounts(
      p.accounts,
      p.retirementAge,
      p.currentAge,
      expectedReturn,
      inflationRate,
      showRealValues,
      p.retirementAge - p.currentAge,
      currentYear,
      { rrspRefundAnnual }
    )
  })

  const combined: ProjectionDataPoint[] = []
  // Match the engine's monthly compounding. Real values are deflated annually,
  // so the real growth factor is nominal monthly growth divided by annual inflation.
  const monthlyGrowth = 1 + expectedReturn / 100 / 12

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

      // The per-person projection stops at that person's retirement age. If
      // the household retires later, keep compounding the early retiree's
      // balance at the expected return instead of freezing it. Real-dollar
      // mode compounds at the real return; nominal mode at the nominal return.
      const yearsAfterRetirement = Math.max(0, offset - lastIndex)
      const nominalFactor = Math.pow(monthlyGrowth, yearsAfterRetirement * 12)
      const growthFactor = showRealValues
        ? nominalFactor / Math.pow(1 + inflationRate / 100, yearsAfterRetirement)
        : nominalFactor
      const pointTotal = (point.Total ?? 0) * growthFactor
      const pointRrsp = point.RRSP !== undefined ? point.RRSP * growthFactor : undefined
      const pointTfsa = point.TFSA !== undefined ? point.TFSA * growthFactor : undefined

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
    rrspTax: summary.rrspTax * factor,
    totalTax: summary.totalTax * factor,
    oasClawback: summary.oasClawback * factor,
    preTaxIncome: summary.preTaxIncome * factor,
    afterTaxIncome: summary.afterTaxIncome * factor,
  }
}

export function ProjectionProvider({ children }: { children: ReactNode }) {
  const { people } = usePeople()
  const {
    expectedReturn,
    inflationRate,
    showRealValues,
    withdrawalRate,
    plannedGifts,
    workingMarginalTaxRate,
    reinvestRrspRefund,
  } = useAssumptions()

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

  const guaranteedIncomeSchedule = useMemo(
    () => buildGuaranteedIncomeSchedule({ people, householdRetirementAge, yearsToRetirement }),
    [people, householdRetirementAge, yearsToRetirement]
  )

  const projectionData = useMemo(
    () => buildCombinedProjection(people, expectedReturn, inflationRate, showRealValues, householdRetirementAge, workingMarginalTaxRate, reinvestRrspRefund),
    [people, expectedReturn, inflationRate, showRealValues, householdRetirementAge, workingMarginalTaxRate, reinvestRrspRefund]
  )
  const conservativeProjectionData = useMemo(
    () => buildCombinedProjection(people, Math.max(0, expectedReturn - 2), inflationRate, showRealValues, householdRetirementAge, workingMarginalTaxRate, reinvestRrspRefund),
    [people, expectedReturn, inflationRate, showRealValues, householdRetirementAge, workingMarginalTaxRate, reinvestRrspRefund]
  )
  const optimisticProjectionData = useMemo(
    () => buildCombinedProjection(people, expectedReturn + 2, inflationRate, showRealValues, householdRetirementAge, workingMarginalTaxRate, reinvestRrspRefund),
    [people, expectedReturn, inflationRate, showRealValues, householdRetirementAge, workingMarginalTaxRate, reinvestRrspRefund]
  )
  const realProjectionData = useMemo(
    () => buildCombinedProjection(people, expectedReturn, inflationRate, true, householdRetirementAge, workingMarginalTaxRate, reinvestRrspRefund),
    [people, expectedReturn, inflationRate, householdRetirementAge, workingMarginalTaxRate, reinvestRrspRefund]
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
      guaranteedIncomeSchedule, totalPortfolio, totalAnnualContributions, retirementTax,
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
