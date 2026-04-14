import type { ProjectionDataPoint } from '@/types/household'
import { getPortfolioAtRetirement } from '@/lib/calculations'
import { formatMoney } from '@/lib/formatting'

interface RetirementProjectionCardProps {
  portfolioView: 'combined' | 'individual'
  currentProjectionData: ProjectionDataPoint[]
  totalPortfolio: number
  selectedPersonPortfolio: number
  yearsToRetirement: number
}

export function RetirementProjectionCard({
  portfolioView,
  currentProjectionData,
  totalPortfolio,
  selectedPersonPortfolio,
  yearsToRetirement
}: RetirementProjectionCardProps) {
  if (yearsToRetirement <= 0) return null

  const portfolioAtRetirement = getPortfolioAtRetirement(currentProjectionData)
  const lastPoint = currentProjectionData.length > 0 ? currentProjectionData[currentProjectionData.length - 1] : null
  const basePortfolio = portfolioView === 'combined' ? totalPortfolio : selectedPersonPortfolio

  return (
    <div className="animate-fade-in-up-delay-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        🎓 Portfolio at Retirement
      </h2>
      <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
        ${formatMoney(portfolioAtRetirement)}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="text-gray-500 dark:text-gray-400">
          Growth: ${formatMoney(portfolioAtRetirement - basePortfolio)} ({((portfolioAtRetirement / basePortfolio - 1) * 100).toFixed(1)}%)
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
