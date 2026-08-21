import type { ProjectionDataPoint } from '@/types/household'
import { getPortfolioAtRetirement } from '@/lib/calculations'
import { formatMoney } from '@/lib/formatting'
import { ModeBadge } from '@/components/ui/ModeBadge'
import { GraduationCap } from 'lucide-react'

interface RetirementProjectionCardProps {
  currentProjectionData: ProjectionDataPoint[]
  totalPortfolio: number
  yearsToRetirement: number
  showRealValues: boolean
}

export function RetirementProjectionCard({
  currentProjectionData,
  totalPortfolio,
  yearsToRetirement,
  showRealValues
}: RetirementProjectionCardProps) {
  if (yearsToRetirement <= 0) return null

  const portfolioAtRetirement = getPortfolioAtRetirement(currentProjectionData)
  const lastPoint = currentProjectionData.length > 0 ? currentProjectionData[currentProjectionData.length - 1] : null

  return (
    <div className="animate-fade-in-up-delay-1 card p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-violet-500" />
        Portfolio at Retirement
        <ModeBadge showRealValues={showRealValues} />
      </h2>
      <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
        ${formatMoney(portfolioAtRetirement)}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="text-gray-500 dark:text-gray-400">
          Growth: ${formatMoney(portfolioAtRetirement - totalPortfolio)}
        </div>
        {lastPoint && (
          <div className="text-amber-600 dark:text-amber-400">
            Total: ${formatMoney(lastPoint.Total ?? 0)}
          </div>
        )}
        {lastPoint?.RRSP !== undefined && (
          <div className="text-indigo-600 dark:text-indigo-400">
            RRSP: ${formatMoney(lastPoint.RRSP ?? 0)}
          </div>
        )}
        {lastPoint?.TFSA !== undefined && (
          <div className="text-emerald-600 dark:text-emerald-400">
            TFSA: ${formatMoney(lastPoint.TFSA ?? 0)}
          </div>
        )}
      </div>
    </div>
  )
}
