import { useRetirementGoal } from '@/hooks/useRetirementGoal'
import { formatMoney } from '@/lib/formatting'
import { getPortfolioAtRetirement, getPortfolioAfterGifts } from '@/lib/calculations'
import type { RetirementTaxSummary } from '@/lib/tax'
import { CheckCircle2, AlertTriangle, Lightbulb, Gift } from 'lucide-react'
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
  effectiveTaxRate?: number
  afterTaxAnnualIncome?: number
  taxSummary?: RetirementTaxSummary | null
}

export function SummaryCard(props: SummaryCardProps) {
  const {
    householdRetirementAge,
    currentProjectionData,
    withdrawalRate,
    afterTaxAnnualIncome,
    taxSummary,
    ...goalProps
  } = props
  const { progress, afterTaxProgress, additionalAnnualSavings, afterTaxAdditionalAnnualSavings, projectedAnnualIncome, afterTaxProjectedAnnualIncome, giftTotal } = useRetirementGoal({ ...goalProps, currentProjectionData, withdrawalRate })

  const isOnTrack = progress >= 100
  const isAfterTaxOnTrack = afterTaxProgress >= 100
  const isOverallOnTrack = isOnTrack && (goalProps.effectiveTaxRate !== undefined && goalProps.effectiveTaxRate > 0 ? isAfterTaxOnTrack : true)
  const { yearsToRetirement, showRealValues } = goalProps

  const afterTaxIncome = afterTaxAnnualIncome ?? afterTaxProjectedAnnualIncome
  const portfolioAtRetirement = getPortfolioAtRetirement(currentProjectionData)
  const portfolioAfterGifts = getPortfolioAfterGifts(portfolioAtRetirement, goalProps.plannedGifts ?? [], yearsToRetirement, goalProps.showRealValues, goalProps.inflationRate)
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
            {giftTotal > 0 ? (
              <>
                (${formatMoney(portfolioAtRetirement)} − ${formatMoney(giftTotal)} gifts) × {withdrawalRate}% ={' '}
                ${formatMoney(portfolioWithdrawal)} + ${formatMoney(guaranteedIncome)} pensions
              </>
            ) : (
              <>&#36;{formatMoney(portfolioWithdrawal)} Safe Withdrawal Rate + &#36;{formatMoney(guaranteedIncome)} pensions</>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">After-Tax Income</div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            ${formatMoney(afterTaxIncome)}<span className="text-xs text-gray-500 font-normal">/yr</span>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            {taxSummary
              ? <>Estimated ${formatMoney(taxSummary.totalTax)} tax on ${formatMoney(taxSummary.preTaxIncome)} (Quebec 2026)</>
              : <>Adjusted for {(goalProps.effectiveTaxRate ?? 0).toFixed(1)}% tax</>}
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
      {taxSummary && taxSummary.perPerson.length > 0 && (
        <div className="mb-6 text-xs text-gray-500 dark:text-gray-400 bg-white/20 dark:bg-black/10 p-3 rounded-lg border border-gray-200/20 dark:border-gray-800/20">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Estimated 2026 tax:</span>{' '}
          {taxSummary.perPerson.map((p, i) => (
            <span key={p.name}>
              {i > 0 && ' • '}
              {p.name} ${formatMoney(p.total)}
            </span>
          ))}
          {taxSummary.oasClawback > 0 && (
            <> (includes ${formatMoney(taxSummary.oasClawback)} OAS clawback)</>
          )}
        </div>
      )}

      {giftTotal > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-200/60 dark:border-amber-800/40 bg-amber-100/50 dark:bg-amber-900/20">
            <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">How planned gifts affect income</span>
          </div>
          <div className="px-4 py-3 text-xs space-y-0.5">
            <div className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-gray-600 dark:text-gray-400">Portfolio at retirement</span>
              <span className="font-medium tabular-nums whitespace-nowrap text-gray-800 dark:text-gray-200">
                ${formatMoney(portfolioAtRetirement)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-gray-600 dark:text-gray-400">
                <span className="text-rose-500 dark:text-rose-400">−</span> Planned gifts
              </span>
              <span className="font-medium tabular-nums whitespace-nowrap text-rose-600 dark:text-rose-400">
                −${formatMoney(giftTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-1.5 mt-1 border-t border-amber-200/60 dark:border-amber-800/40">
              <span className="font-medium text-gray-700 dark:text-gray-300">Investable portfolio</span>
              <span className="font-semibold tabular-nums whitespace-nowrap text-gray-900 dark:text-white">
                ${formatMoney(portfolioAfterGifts)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-gray-600 dark:text-gray-400">
                <span className="text-indigo-500 dark:text-indigo-400">×</span> {withdrawalRate}% withdrawal
              </span>
              <span className="tabular-nums whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                ${formatMoney(portfolioWithdrawal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-gray-600 dark:text-gray-400">
                <span className="text-emerald-500 dark:text-emerald-400">+</span> Pensions / CPP / OAS
              </span>
              <span className="tabular-nums whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                ${formatMoney(guaranteedIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 mt-1.5 py-2 px-2 -mx-2 rounded-lg bg-amber-100/60 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-800/40">
              <span className="font-semibold text-amber-900 dark:text-amber-200">Pre-tax income</span>
              <span className="font-bold tabular-nums whitespace-nowrap text-amber-900 dark:text-amber-200">
                ${formatMoney(projectedAnnualIncome)}
              </span>
            </div>
          </div>
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
