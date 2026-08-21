import type { ProjectionDataPoint } from '@/types/household'
import { getCalculator } from '@/lib/wasm-loader'

export function getPortfolioAtRetirement(data: ProjectionDataPoint[]): number {
  return data.length > 0 ? data[data.length - 1].Total : 0
}

export interface PlannedGiftLite {
  amount: number
  age: number
}

// Total value of planned one-time gifts, expressed in the same dollar basis as the
// retirement portfolio: real ("today's") dollars when showRealValues, otherwise
// inflated to retirement age by the household's years to retirement.
export function getGiftTotal(
  gifts: PlannedGiftLite[],
  yearsToRetirement: number,
  showRealValues: boolean,
  inflationRate: number,
): number {
  if (showRealValues) {
    return gifts.reduce((sum, g) => sum + g.amount, 0)
  }
  const factor = Math.pow(1 + inflationRate / 100, Math.max(0, yearsToRetirement))
  return gifts.reduce((sum, g) => sum + g.amount * factor, 0)
}

export function getPortfolioAfterGifts(
  portfolioAtRetirement: number,
  gifts: PlannedGiftLite[],
  yearsToRetirement: number,
  showRealValues: boolean,
  inflationRate: number,
): number {
  return Math.max(0, portfolioAtRetirement - getGiftTotal(gifts, yearsToRetirement, showRealValues, inflationRate))
}

export interface RetirementGoalResult {
  portfolioAtRetirement: number
  requiredAnnualIncome: number
  requiredAnnualIncomeAfterPension: number
  requiredPortfolio: number
  giftTotal: number
  portfolioAfterGifts: number
  progress: number
  gap: number
  additionalAnnualSavings: number
  afterTaxPortfolioAtRetirement: number
  afterTaxPortfolioAfterGifts: number
  afterTaxProgress: number
  afterTaxGap: number
  afterTaxAdditionalAnnualSavings: number
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
  showRealValues?: boolean
  plannedGifts?: PlannedGiftLite[]
  retirementTaxRate?: number
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
    showRealValues = true,
    plannedGifts = [],
    retirementTaxRate = 20,
  } = params

  // In nominal ("future dollars") mode, the income target and pension are inflated
  // to retirement-age dollars so progress stays comparable to the nominal portfolio.
  const inflationFactor = showRealValues
    ? 1
    : Math.pow(1 + inflationRate / 100, Math.max(0, yearsToRetirement))

  const portfolioAtRetirement = getPortfolioAtRetirement(currentProjectionData)
  // Gifts are reserved as a separate pot withdrawn from the retirement portfolio.
  const giftTotal = getGiftTotal(plannedGifts, yearsToRetirement, showRealValues, inflationRate)
  const portfolioAfterGifts = getPortfolioAfterGifts(portfolioAtRetirement, plannedGifts, yearsToRetirement, showRealValues, inflationRate)
  const targetAnnualIncome = annualIncome * inflationFactor
  const targetPension = annualPension * inflationFactor
  const requiredAnnualIncome = targetAnnualIncome * (replacementRate / 100)
  const requiredAnnualIncomeAfterPension = Math.max(0, requiredAnnualIncome - targetPension)
  // Required portfolio = income portfolio (for the 4% rule) PLUS the reserved gifts.
  const requiredPortfolio = (withdrawalRate > 0 ? requiredAnnualIncomeAfterPension / (withdrawalRate / 100) : 0) + giftTotal
  const progress = requiredPortfolio > 0 ? Math.min(100, (portfolioAtRetirement / requiredPortfolio) * 100) : 0
  const gap = requiredPortfolio - portfolioAtRetirement

  const additionalAnnualSavings = yearsToRetirement > 0
    ? calculateAdditionalAnnualSavings(currentProjectionData, currentPortfolio, requiredPortfolio, yearsToRetirement, expectedReturn, inflationRate, currentAnnualContributions, gap)
    : 0

  // Calculate after-tax metrics (deducting estimated tax rate on the RRSP portion)
  const lastPoint = currentProjectionData.length > 0 ? currentProjectionData[currentProjectionData.length - 1] : null
  const rrspAtRetirement = lastPoint?.RRSP ?? 0
  const afterTaxPortfolioAtRetirement = portfolioAtRetirement - (rrspAtRetirement * (retirementTaxRate / 100))
  const afterTaxPortfolioAfterGifts = Math.max(0, afterTaxPortfolioAtRetirement - giftTotal)
  const afterTaxProgress = requiredPortfolio > 0 ? Math.min(100, (afterTaxPortfolioAtRetirement / requiredPortfolio) * 100) : 0
  const afterTaxGap = requiredPortfolio - afterTaxPortfolioAtRetirement
  const afterTaxAdditionalAnnualSavings = yearsToRetirement > 0
    ? calculateAdditionalAnnualSavings(currentProjectionData, currentPortfolio, requiredPortfolio + (rrspAtRetirement * (retirementTaxRate / 100)), yearsToRetirement, expectedReturn, inflationRate, currentAnnualContributions, afterTaxGap)
    : 0

  return {
    portfolioAtRetirement,
    requiredAnnualIncome,
    requiredAnnualIncomeAfterPension,
    requiredPortfolio,
    giftTotal,
    portfolioAfterGifts,
    progress,
    gap,
    additionalAnnualSavings,
    afterTaxPortfolioAtRetirement,
    afterTaxPortfolioAfterGifts,
    afterTaxProgress,
    afterTaxGap,
    afterTaxAdditionalAnnualSavings,
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
