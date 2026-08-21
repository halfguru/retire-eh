import { useRetirementGoal } from '@/hooks/useRetirementGoal'
import { formatMoney } from '@/lib/formatting'
import { getPortfolioAtRetirement, getPortfolioAfterGifts } from '@/lib/calculations'
import { CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'
import { ModeBadge } from '@/components/ui/ModeBadge'

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
  showRealValues: boolean
  plannedGifts: import('@/lib/calculations').PlannedGiftLite[]
  retirementTaxRate?: number
}

export function SummaryCard(props: SummaryCardProps) {
  const { householdRetirementAge, currentProjectionData, withdrawalRate, ...goalProps } = props
  const { progress, afterTaxProgress, additionalAnnualSavings, afterTaxAdditionalAnnualSavings, projectedAnnualIncome, afterTaxProjectedAnnualIncome, giftTotal } = useRetirementGoal({ ...goalProps, currentProjectionData, withdrawalRate })

  const isOnTrack = progress >= 100
  const isAfterTaxOnTrack = afterTaxProgress >= 100
  const isOverallOnTrack = isOnTrack && (goalProps.retirementTaxRate !== undefined && goalProps.retirementTaxRate > 0 ? isAfterTaxOnTrack : true)
  const { yearsToRetirement, showRealValues } = goalProps

  const portfolioAfterGifts = getPortfolioAfterGifts(getPortfolioAtRetirement(currentProjectionData), goalProps.plannedGifts ?? [], yearsToRetirement, goalProps.showRealValues, goalProps.inflationRate)
  const portfolioWithdrawal = portfolioAfterGifts * (withdrawalRate / 100)
  const guaranteedIncome = projectedAnnualIncome - portfolioWithdrawal

  return (
    <div className={`animate-fade-in-up rounded-2xl border-2 p-6 sm:p-8 ${isOverallOnTrack
      ? 'bg-gradient-to-br from-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-300 dark:border-emerald-800'
      : 'bg-gradient-to-br from-amber-50/60 to-amber-100/40 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-300 dark:border-amber-800'
    }`}>
      {/* Top Banner Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-gray-700/50 pb-6 mb-6">
        <div className="flex items-center gap-3">
          {isOverallOnTrack ? (
            <CheckCircle2 className="w-8 h-8 text-secondary shrink-0" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-error shrink-0" />
          )}
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${isOverallOnTrack ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {isOverallOnTrack ? "You're on Track!" : 'Plan Adjustment Needed'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Based on target retirement age of {householdRetirementAge}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <ModeBadge showRealValues={showRealValues} />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">Pre-Tax Income</div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
            ${formatMoney(projectedAnnualIncome)}<span className="text-xs text-gray-500 font-normal">/yr</span>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            ${formatMoney(portfolioWithdrawal)} SWR + ${formatMoney(guaranteedIncome)} pensions
          </div>
        </div>

        <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">After-Tax Income</div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            ${formatMoney(afterTaxProjectedAnnualIncome)}<span className="text-xs text-gray-500 font-normal">/yr</span>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            Adjusted for {goalProps.retirementTaxRate ?? 20}% RRSP withdrawal tax
          </div>
        </div>

        <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200/50 dark:border-gray-800/50 sm:col-span-2 md:col-span-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">Progress Details</div>
          <div className="space-y-1.5 mt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Pre-Tax Progress:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{progress.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">After-Tax Progress:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{afterTaxProgress.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Special Items / Warnings */}
      {giftTotal > 0 && (
        <div className="mb-6 text-xs text-gray-500 dark:text-gray-400 bg-white/20 dark:bg-black/10 p-3 rounded-lg border border-gray-200/20 dark:border-gray-800/20">
          🎁 Reserving <strong>${formatMoney(giftTotal)}</strong> for planned gifts (excluded from safe withdrawals)
        </div>
      )}

      {/* Save adjustments */}
      {!isAfterTaxOnTrack && yearsToRetirement > 0 && (
        <div className="pt-4 border-t border-amber-200/50 dark:border-amber-800/50">
          <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
             <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
             <span>Save an additional <strong className="text-base text-amber-900 dark:text-amber-200">${formatMoney(afterTaxAdditionalAnnualSavings)}/year</strong> (after-tax adjusted) to stay fully on track for your goals.</span>
          </p>
        </div>
      )}
      {isAfterTaxOnTrack && !isOnTrack && yearsToRetirement > 0 && (
        <div className="pt-4 border-t border-amber-200/50 dark:border-amber-800/50">
          <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
             <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
             <span>Save an additional <strong className="text-base text-amber-900 dark:text-amber-200">${formatMoney(additionalAnnualSavings)}/year</strong> to fully achieve your pre-tax goals.</span>
          </p>
        </div>
      )}
    </div>
  )
}
