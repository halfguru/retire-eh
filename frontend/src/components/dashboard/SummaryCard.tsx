import type { ProjectionDataPoint } from '@/hooks/useProjection'
import { getCalculator } from '@/lib/wasm-loader'

interface SummaryCardProps {
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
  householdRetirementAge: number
}

export function SummaryCard({
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
  householdRetirementAge
}: SummaryCardProps) {
  const portfolioAtRetirement = currentProjectionData.length > 0
    ? currentProjectionData[currentProjectionData.length - 1].Total
    : 0

  const requiredAnnualIncome = annualIncome * (replacementRate / 100)
  const requiredAnnualIncomeAfterPension = Math.max(0, requiredAnnualIncome - annualPension)
  const requiredPortfolio = withdrawalRate > 0 ? requiredAnnualIncomeAfterPension / (withdrawalRate / 100) : 0
  const progress = requiredPortfolio > 0 ? Math.min(100, (portfolioAtRetirement / requiredPortfolio) * 100) : 0
  const gap = requiredPortfolio - portfolioAtRetirement

  const calculateAdditionalAnnualSavings = (): number => {
    const initialPortfolio = currentProjectionData.length > 0 ? currentProjectionData[0].Total : currentPortfolio
    try {
      const calculator = getCalculator()
      return calculator.calculate_additional_annual_savings(
        initialPortfolio,
        requiredPortfolio,
        yearsToRetirement,
        expectedReturn,
        inflationRate,
        currentAnnualContributions
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

  const additionalAnnualSavings = yearsToRetirement > 0 ? calculateAdditionalAnnualSavings() : 0
  const isOnTrack = progress >= 100

  const projectedAnnualIncome = (portfolioAtRetirement * (withdrawalRate / 100)) + annualPension

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }} className={`rounded-xl shadow-lg border-2 p-6 sm:p-8 ${isOnTrack
      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-300 dark:border-emerald-700'
      : 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-300 dark:border-amber-700'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl sm:text-4xl">{isOnTrack ? '✅' : '⚠️'}</span>
            <h2 className={`text-xl sm:text-2xl font-bold ${isOnTrack
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-amber-700 dark:text-amber-300'
            }`}>
              {isOnTrack ? "You're on track!" : 'Not quite there yet'}
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Retire at age {householdRetirementAge} with <span className="font-semibold">${projectedAnnualIncome.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year</span> income
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">Progress</div>
          <div className={`text-2xl sm:text-3xl font-bold ${isOnTrack
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-amber-600 dark:text-amber-400'
          }`}>
            {progress >= 100 ? '100%' : `${progress.toFixed(0)}%`}
          </div>
        </div>
      </div>

      {!isOnTrack && yearsToRetirement > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-700">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            💡 Save an additional <span className="font-bold">${additionalAnnualSavings.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year</span> to reach your goal
          </p>
        </div>
      )}
    </div>
  )
}
