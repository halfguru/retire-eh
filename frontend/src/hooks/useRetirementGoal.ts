import { useMemo } from 'react'
import type { ProjectionDataPoint } from '@/types/household'
import { calculateRetirementGoal, getPortfolioAtRetirement, type RetirementGoalResult } from '@/lib/calculations'

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
}

export interface RetirementGoalWithIncome extends RetirementGoalResult {
  projectedAnnualIncome: number
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
    }),
    [currentProjectionData, annualIncome, annualPension, replacementRate, withdrawalRate, yearsToRetirement, expectedReturn, inflationRate, currentAnnualContributions, currentPortfolio]
  )

  const projectedAnnualIncome = useMemo(
    () => (getPortfolioAtRetirement(currentProjectionData) * (withdrawalRate / 100)) + annualPension,
    [currentProjectionData, withdrawalRate, annualPension]
  )

  return { ...goal, projectedAnnualIncome }
}
