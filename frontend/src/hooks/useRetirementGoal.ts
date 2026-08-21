import { useMemo } from 'react'
import type { ProjectionDataPoint } from '@/types/household'
import { calculateRetirementGoal, getPortfolioAtRetirement, getPortfolioAfterGifts, type RetirementGoalResult, type PlannedGiftLite } from '@/lib/calculations'

interface UseRetirementGoalParams {
  currentProjectionData: ProjectionDataPoint[]
  annualIncome: number
  annualPension: number
  replacementRate: number
  withdrawalRate: number
  yearsToRetirement: number
  expectedReturn: number
  inflationRate: number
  currentAnnualContributions: number
  currentPortfolio: number
  showRealValues?: boolean
  plannedGifts?: PlannedGiftLite[]
  retirementTaxRate?: number
}

export interface RetirementGoalWithIncome extends RetirementGoalResult {
  projectedAnnualIncome: number
  afterTaxProjectedAnnualIncome: number
}

export function useRetirementGoal({
  currentProjectionData,
  annualIncome,
  annualPension,
  replacementRate,
  withdrawalRate,
  yearsToRetirement,
  expectedReturn,
  inflationRate,
  currentAnnualContributions,
  currentPortfolio,
  showRealValues = true,
  plannedGifts = [],
  retirementTaxRate = 20,
}: UseRetirementGoalParams): RetirementGoalWithIncome {
  const goal = useMemo(
    () => calculateRetirementGoal({
      currentProjectionData,
      annualIncome,
      annualPension,
      replacementRate,
      withdrawalRate,
      yearsToRetirement,
      expectedReturn,
      inflationRate,
      currentAnnualContributions,
      currentPortfolio,
      showRealValues,
      plannedGifts,
      retirementTaxRate,
    }),
    [currentProjectionData, annualIncome, annualPension, replacementRate, withdrawalRate, yearsToRetirement, expectedReturn, inflationRate, currentAnnualContributions, currentPortfolio, showRealValues, plannedGifts, retirementTaxRate]
  )

  const inflationFactor = showRealValues
    ? 1
    : Math.pow(1 + inflationRate / 100, Math.max(0, yearsToRetirement))

  const projectedAnnualIncome = useMemo(
    () => (getPortfolioAfterGifts(getPortfolioAtRetirement(currentProjectionData), plannedGifts, yearsToRetirement, showRealValues, inflationRate) * (withdrawalRate / 100)) + annualPension * inflationFactor,
    [currentProjectionData, withdrawalRate, annualPension, inflationFactor, plannedGifts, yearsToRetirement, showRealValues, inflationRate]
  )

  const afterTaxProjectedAnnualIncome = useMemo(
    () => (goal.afterTaxPortfolioAfterGifts * (withdrawalRate / 100)) + annualPension * inflationFactor,
    [goal.afterTaxPortfolioAfterGifts, withdrawalRate, annualPension, inflationFactor]
  )

  return { ...goal, projectedAnnualIncome, afterTaxProjectedAnnualIncome }
}

