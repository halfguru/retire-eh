import { useMemo } from 'react'
import type { ProjectionDataPoint } from '@/types/household'
import { calculateRetirementGoal, getPortfolioAtRetirement, getPortfolioAfterGifts, type RetirementGoalResult, type PlannedGiftLite } from '@/lib/calculations'

interface UseRetirementGoalParams {
  currentProjectionData: ProjectionDataPoint[]
  annualIncome: number
  annualPension: number
  guaranteedIncomeSchedule?: number[]
  replacementRate: number
  withdrawalRate: number
  yearsToRetirement: number
  expectedReturn: number
  inflationRate: number
  currentAnnualContributions: number
  currentPortfolio: number
  showRealValues?: boolean
  plannedGifts?: PlannedGiftLite[]
  effectiveTaxRate?: number
}

export interface RetirementGoalWithIncome extends RetirementGoalResult {
  projectedAnnualIncome: number
  afterTaxProjectedAnnualIncome: number
}

export function useRetirementGoal({
  currentProjectionData,
  annualIncome,
  annualPension,
  guaranteedIncomeSchedule = [],
  replacementRate,
  withdrawalRate,
  yearsToRetirement,
  expectedReturn,
  inflationRate,
  currentAnnualContributions,
  currentPortfolio,
  showRealValues = true,
  plannedGifts = [],
  effectiveTaxRate = 0,
}: UseRetirementGoalParams): RetirementGoalWithIncome {
  const goal = useMemo(
    () => calculateRetirementGoal({
      currentProjectionData,
      annualIncome,
      annualPension,
      guaranteedIncomeSchedule,
      replacementRate,
      withdrawalRate,
      yearsToRetirement,
      expectedReturn,
      inflationRate,
      currentAnnualContributions,
      currentPortfolio,
      showRealValues,
      plannedGifts,
      effectiveTaxRate,
    }),
    [currentProjectionData, annualIncome, annualPension, guaranteedIncomeSchedule, replacementRate, withdrawalRate, yearsToRetirement, expectedReturn, inflationRate, currentAnnualContributions, currentPortfolio, showRealValues, plannedGifts, effectiveTaxRate]
  )

  const inflationFactor = showRealValues
    ? 1
    : Math.pow(1 + inflationRate / 100, Math.max(0, yearsToRetirement))
  const projectedGuaranteedIncome = goal.levelizedGuaranteedIncome * inflationFactor

  const projectedAnnualIncome = useMemo(
    () => (getPortfolioAfterGifts(getPortfolioAtRetirement(currentProjectionData), plannedGifts, yearsToRetirement, showRealValues, inflationRate) * (withdrawalRate / 100)) + projectedGuaranteedIncome,
    [currentProjectionData, withdrawalRate, projectedGuaranteedIncome, plannedGifts, yearsToRetirement, showRealValues, inflationRate]
  )

  const afterTaxProjectedAnnualIncome = useMemo(
    () => (goal.afterTaxPortfolioAfterGifts * (withdrawalRate / 100)) + projectedGuaranteedIncome,
    [goal.afterTaxPortfolioAfterGifts, withdrawalRate, projectedGuaranteedIncome]
  )

  return { ...goal, projectedAnnualIncome, afterTaxProjectedAnnualIncome }
}

