import { useRetirementGoal } from '@/hooks/useRetirementGoal'
import { formatMoney } from '@/lib/formatting'

interface SummaryCardProps {
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
  householdRetirementAge: number
}

export function SummaryCard(props: SummaryCardProps) {
  const { householdRetirementAge, ...goalProps } = props
  const { progress, additionalAnnualSavings, projectedAnnualIncome } = useRetirementGoal(goalProps)

  const isOnTrack = progress >= 100
  const { yearsToRetirement } = goalProps

  return (
    <div className={`animate-fade-in-up rounded-xl shadow-lg border-2 p-6 sm:p-8 ${isOnTrack
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
            Retire at age {householdRetirementAge} with <span className="font-semibold">${formatMoney(projectedAnnualIncome)}/year</span> income
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">Progress</div>
          <div className={`text-2xl sm:text-3xl font-bold ${isOnTrack
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-amber-600 dark:text-amber-400'
          }`}>
            {isOnTrack ? '100%' : `${progress.toFixed(0)}%`}
          </div>
        </div>
      </div>

      {!isOnTrack && yearsToRetirement > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-700">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            💡 Save an additional <span className="font-bold">${formatMoney(additionalAnnualSavings)}/year</span> to reach your goal
          </p>
        </div>
      )}
    </div>
  )
}
