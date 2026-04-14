import type { ProjectionDataPoint } from '@/types/household'
import { getCalculator } from '@/lib/wasm-loader'

export function getPortfolioAtRetirement(data: ProjectionDataPoint[]): number {
  return data.length > 0 ? data[data.length - 1].Total : 0
}

export interface RetirementGoalResult {
  portfolioAtRetirement: number
  requiredAnnualIncome: number
  requiredAnnualIncomeAfterPension: number
  requiredPortfolio: number
  progress: number
  gap: number
  additionalAnnualSavings: number
}

export function calculateRetirementGoal(params: {
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
}): RetirementGoalResult {
  const {
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
  } = params

  const portfolioAtRetirement = getPortfolioAtRetirement(currentProjectionData)
  const requiredAnnualIncome = annualIncome * (replacementRate / 100)
  const requiredAnnualIncomeAfterPension = Math.max(0, requiredAnnualIncome - annualPension)
  const requiredPortfolio = withdrawalRate > 0 ? requiredAnnualIncomeAfterPension / (withdrawalRate / 100) : 0
  const progress = requiredPortfolio > 0 ? Math.min(100, (portfolioAtRetirement / requiredPortfolio) * 100) : 0
  const gap = requiredPortfolio - portfolioAtRetirement

  const additionalAnnualSavings = yearsToRetirement > 0
    ? calculateAdditionalAnnualSavings(currentProjectionData, currentPortfolio, requiredPortfolio, yearsToRetirement, expectedReturn, inflationRate, currentAnnualContributions, gap)
    : 0

  return {
    portfolioAtRetirement,
    requiredAnnualIncome,
    requiredAnnualIncomeAfterPension,
    requiredPortfolio,
    progress,
    gap,
    additionalAnnualSavings,
  }
}

function calculateAdditionalAnnualSavings(
  currentProjectionData: ProjectionDataPoint[],
  currentPortfolio: number,
  requiredPortfolio: number,
  yearsToRetirement: number,
  expectedReturn: number,
  inflationRate: number,
  currentAnnualContributions: number,
  gap: number,
): number {
  const initialPortfolio = currentProjectionData.length > 0 ? currentProjectionData[0].Total : currentPortfolio
  try {
    const calculator = getCalculator()
    return calculator.calculate_additional_annual_savings(
      initialPortfolio,
      requiredPortfolio,
      yearsToRetirement,
      expectedReturn,
      inflationRate,
      currentAnnualContributions,
    )
  } catch {
    const monthlyNominalRate = expectedReturn / 100 / 12
    const monthlyInflationRate = inflationRate / 100 / 12
    const months = yearsToRetirement * 12
    const monthlyRealRate = monthlyNominalRate - monthlyInflationRate
    if (monthlyRealRate <= 0) return gap / yearsToRetirement
    const monthlyRealSavings = gap * monthlyRealRate / ((1 + monthlyRealRate) ** months - 1)
    return monthlyRealSavings * 12
  }
}
