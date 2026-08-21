import { useRetirementGoal } from '@/hooks/useRetirementGoal'
import { formatMoney } from '@/lib/formatting'
import { type PlannedGiftLite } from '@/lib/calculations'
import { Target, Wallet } from 'lucide-react'

interface GoalsCardProps {
  currentProjectionData: Parameters<typeof useRetirementGoal>[0]['currentProjectionData']
  annualIncome: number
  annualPension: number
  replacementRate: number
  withdrawalRate: number
  yearsToRetirement: number
  expectedReturn: number
  inflationRate: number
  currentAnnualContributions: number
  currentPortfolio: number
  showRealValues: boolean
  plannedGifts: PlannedGiftLite[]
  retirementTaxRate?: number
}

export function GoalsCard(props: GoalsCardProps) {
  const goal = useRetirementGoal(props)
  const { yearsToRetirement, annualPension, retirementTaxRate } = props

  return (
    <div className="animate-fade-in-up card p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-secondary" />
        Retirement Goal Progress
      </h2>

      <div className="space-y-4">
        {annualPension > 0 && (
          <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex justify-between items-center">
              <span><Wallet className="inline w-4 h-4 align-middle text-amber-500" /> Annual Pension + CPP Income</span>
              <span className="font-semibold">${formatMoney(annualPension)}/year</span>
            </div>
            <div className="text-xs mt-1 text-emerald-700 dark:text-emerald-300">
              After pension, need: ${formatMoney(goal.requiredAnnualIncomeAfterPension)}/year from portfolio
            </div>
          </div>
        )}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Pre-Tax Goal Progress: {goal.progress.toFixed(1)}%</span>
              <span className="text-gray-500 dark:text-gray-400">Target: ${formatMoney(goal.requiredPortfolio)} (Pre-Tax)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${goal.progress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, goal.progress)}%` }}
              />
            </div>
          </div>

          {retirementTaxRate !== undefined && retirementTaxRate > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400 font-medium text-indigo-600 dark:text-indigo-400">After-Tax Progress: {goal.afterTaxProgress.toFixed(1)}%</span>
                <span className="text-gray-505 dark:text-gray-400">Adjusted for {retirementTaxRate}% Tax</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${goal.afterTaxProgress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, goal.afterTaxProgress)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {goal.giftTotal > 0 && (
          <div className="text-xs text-center text-amber-605 dark:text-amber-400 mt-1">
            Includes {formatMoney(goal.giftTotal)} reserved for planned gifts
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pre-Tax vs After-Tax Balance</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              ${formatMoney(goal.portfolioAtRetirement)} / ${formatMoney(goal.afterTaxPortfolioAtRetirement)}
            </div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">After-Tax Gap to Goal</div>
            <div className={`text-sm font-semibold ${goal.afterTaxGap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              ${formatMoney(goal.afterTaxGap)}
            </div>
          </div>
        </div>

        {goal.afterTaxGap > 0 && yearsToRetirement > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <Wallet className="inline w-4 h-4 align-middle text-amber-500" /> To reach your goal, save an additional{' '}
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              ${formatMoney(goal.afterTaxAdditionalAnnualSavings)}
            </span>{' '}
            per year across accounts (after-tax adjusted).
          </div>
        )}
      </div>
    </div>
  )
}
