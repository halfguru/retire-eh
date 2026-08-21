import { useRetirementGoal } from '@/hooks/useRetirementGoal'
import { useProjectionContext } from '@/contexts/ProjectionContext'
import { useAssumptions } from '@/contexts/AssumptionsContext'
import { formatMoney } from '@/lib/formatting'
import { getPortfolioAtRetirement } from '@/lib/calculations'
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

export function PlanSummaryCard() {
  const projection = useProjectionContext()
  const assumptions = useAssumptions()

  const { progress, gap, additionalAnnualSavings, requiredPortfolio } = useRetirementGoal({
    currentProjectionData: projection.currentProjectionData,
    annualIncome: projection.totalAnnualIncome,
    annualPension: projection.totalAnnualPension + projection.totalAnnualCpp,
    replacementRate: assumptions.replacementRate,
    withdrawalRate: assumptions.withdrawalRate,
    yearsToRetirement: projection.yearsToRetirement,
    expectedReturn: assumptions.expectedReturn,
    inflationRate: assumptions.inflationRate,
    currentAnnualContributions: projection.totalAnnualContributions,
    currentPortfolio: projection.totalPortfolio,
    showRealValues: assumptions.showRealValues,
    plannedGifts: assumptions.plannedGifts,
  })

  const portfolioAtRetirement = getPortfolioAtRetirement(projection.currentProjectionData)
  const isComplete = progress >= 100

  return (
    <div className="card p-5 border-2 border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-500" />
        Live Goal Progress
      </h3>

      <div className="space-y-4">
        {/* Progress Bar & Percent */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Goal Completion</span>
            <span className={`text-lg font-bold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isComplete ? '100%' : `${progress.toFixed(0)}%`}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Dynamic projections */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Projected Savings</div>
            <div className="text-base font-bold text-gray-800 dark:text-gray-100">
              ${formatMoney(portfolioAtRetirement)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Required Savings</div>
            <div className="text-base font-bold text-gray-800 dark:text-gray-100">
              ${formatMoney(requiredPortfolio)}
            </div>
          </div>
        </div>

        {/* Feedback message */}
        <div className="pt-2">
          {isComplete ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs flex gap-2 items-start">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Great job! You are currently on track to reach your retirement target.</span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs flex flex-col gap-1">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>You are currently short by <strong>${formatMoney(gap)}</strong>.</span>
              </div>
              {projection.yearsToRetirement > 0 && (
                <p className="mt-1 pl-6">
                  Save an additional <strong>${formatMoney(additionalAnnualSavings)}/year</strong> to bridge this gap.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
