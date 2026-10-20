import { usePeople } from '@/contexts/PeopleContext'
import { useAssumptions } from '@/contexts/AssumptionsContext'
import { useProjectionContext } from '@/contexts/ProjectionContext'
import { useRetirementGoal } from '@/hooks/useRetirementGoal'
import { buildPlanNarrative } from '@/lib/narrative'

export function usePlanNarrative() {
  const { people } = usePeople()
  const assumptions = useAssumptions()
  const projection = useProjectionContext()

  const totalGuaranteedPension =
    projection.totalAnnualPension + projection.totalAnnualCpp + projection.totalAnnualOas

  const goal = useRetirementGoal({
    currentProjectionData: projection.currentProjectionData,
    annualIncome: projection.totalAnnualIncome,
    annualPension: totalGuaranteedPension,
    replacementRate: assumptions.replacementRate,
    withdrawalRate: assumptions.withdrawalRate,
    yearsToRetirement: projection.yearsToRetirement,
    expectedReturn: assumptions.expectedReturn,
    inflationRate: assumptions.inflationRate,
    currentAnnualContributions: projection.totalAnnualContributions,
    currentPortfolio: projection.totalPortfolio,
    showRealValues: assumptions.showRealValues,
    plannedGifts: assumptions.plannedGifts,
    effectiveTaxRate: projection.retirementTax?.effectiveRrspTaxRate ?? 0,
  })

  const tax = projection.retirementTax
  const effectiveTaxRate = tax?.effectiveRrspTaxRate ?? 0
  const useAfterTax = effectiveTaxRate > 0
  const gap = useAfterTax ? goal.afterTaxGap : goal.gap
  const progress = useAfterTax ? goal.afterTaxProgress : goal.progress
  const additionalAnnualSavings = useAfterTax
    ? goal.afterTaxAdditionalAnnualSavings
    : goal.additionalAnnualSavings
  const portfolioWithdrawal = goal.portfolioAfterGifts * (assumptions.withdrawalRate / 100)
  const guaranteedAnnualIncome = Math.max(0, goal.projectedAnnualIncome - portfolioWithdrawal)

  const narrative = buildPlanNarrative({
    people: people.map(p => ({
      name: p.name,
      currentAge: p.currentAge,
      retirementAge: p.retirementAge,
    })),
    totalPortfolio: projection.totalPortfolio,
    totalAnnualContributions: projection.totalAnnualContributions,
    totalAnnualIncome: projection.totalAnnualIncome,
    householdRetirementAge: projection.householdRetirementAge,
    yearsToRetirement: projection.yearsToRetirement,
    expectedReturn: assumptions.expectedReturn,
    inflationRate: assumptions.inflationRate,
    replacementRate: assumptions.replacementRate,
    withdrawalRate: assumptions.withdrawalRate,
    showRealValues: assumptions.showRealValues,
    giftTotal: goal.giftTotal,
    portfolioAtRetirement: goal.portfolioAtRetirement,
    requiredPortfolio: goal.requiredPortfolio,
    requiredAnnualIncome: goal.requiredAnnualIncome,
    projectedAnnualIncome: goal.projectedAnnualIncome,
    afterTaxAnnualIncome: tax?.afterTaxIncome ?? goal.afterTaxProjectedAnnualIncome,
    guaranteedAnnualIncome,
    portfolioWithdrawal,
    progress,
    gap,
    additionalAnnualSavings,
    taxTotal: tax?.totalTax,
    oasClawback: tax?.oasClawback,
  })

  return { narrative, showRealValues: assumptions.showRealValues }
}
