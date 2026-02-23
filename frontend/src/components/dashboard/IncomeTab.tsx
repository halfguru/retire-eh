import { IncomeBreakdownCard } from './IncomeBreakdownCard'
import type { ProjectionDataPoint } from '@/hooks/useProjection'

interface IncomeTabProps {
  currentProjectionData: ProjectionDataPoint[]
  annualPension: number
  withdrawalRate: number
  householdRetirementAge: number
}

export function IncomeTab({
  currentProjectionData,
  annualPension,
  withdrawalRate,
  householdRetirementAge
}: IncomeTabProps) {
  const portfolioAtRetirement = currentProjectionData.length > 0
    ? currentProjectionData[currentProjectionData.length - 1].Total
    : 0

  return (
    <div className="space-y-6">
      <IncomeBreakdownCard
        portfolioAtRetirement={portfolioAtRetirement}
        annualPension={annualPension}
        withdrawalRate={withdrawalRate}
        retirementAge={householdRetirementAge}
      />

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          📋 Income Sources Explained
        </h3>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-800 dark:text-gray-200">Portfolio Withdrawal:</strong>{' '}
            The {withdrawalRate}% safe withdrawal rate is a common rule of thumb for sustainable retirement income from investments.
          </div>
          <div>
            <strong className="text-gray-800 dark:text-gray-200">CPP (Canada Pension Plan):</strong>{' '}
            Government pension based on your contributions during working years. Maximum in 2024 is about $1,364/month.
          </div>
          <div>
            <strong className="text-gray-800 dark:text-gray-200">OAS (Old Age Security):</strong>{' '}
            Government benefit available at age 65. Maximum in 2024 is about $691/month. Clawed back at high income levels.
          </div>
          <div>
            <strong className="text-gray-800 dark:text-gray-200">Employer Pension:</strong>{' '}
            Any workplace pension you've entered. This includes defined benefit or defined contribution plans.
          </div>
        </div>
      </div>
    </div>
  )
}
