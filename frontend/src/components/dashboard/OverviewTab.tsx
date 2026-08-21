import { SummaryCard } from './SummaryCard'
import { PortfolioCard } from './PortfolioCard'
import { RetirementProjectionCard } from './RetirementProjectionCard'
import { GoalsCard } from './GoalsCard'
import { IncomeBreakdownCard } from './IncomeBreakdownCard'
import { usePeople } from '@/contexts/PeopleContext'
import { useAssumptions } from '@/contexts/AssumptionsContext'
import { useProjectionContext } from '@/contexts/ProjectionContext'
import { getPortfolioAtRetirement } from '@/lib/calculations'
import { ClipboardList } from 'lucide-react'

export function OverviewTab() {
  const { people } = usePeople()
  const assumptions = useAssumptions()
  const projection = useProjectionContext()

  const allAccounts = people.flatMap(p => p.accounts)
  const totalGuaranteedPension = projection.totalAnnualPension + projection.totalAnnualCpp
  const portfolioAtRetirement = getPortfolioAtRetirement(projection.currentProjectionData)

  return (
    <div className="space-y-6">
      <SummaryCard
        currentProjectionData={projection.currentProjectionData}
        annualIncome={projection.totalAnnualIncome}
        annualPension={totalGuaranteedPension}
        replacementRate={assumptions.replacementRate}
        withdrawalRate={assumptions.withdrawalRate}
        yearsToRetirement={projection.yearsToRetirement}
        expectedReturn={assumptions.expectedReturn}
        inflationRate={assumptions.inflationRate}
        currentAnnualContributions={projection.totalAnnualContributions}
        currentPortfolio={projection.totalPortfolio}
        householdRetirementAge={projection.householdRetirementAge}
        showRealValues={assumptions.showRealValues}
        plannedGifts={assumptions.plannedGifts}
        retirementTaxRate={assumptions.retirementTaxRate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
        <PortfolioCard
          totalPortfolio={projection.totalPortfolio}
          allAccounts={allAccounts}
        />

        <IncomeBreakdownCard
          portfolioAtRetirement={portfolioAtRetirement}
          annualPension={projection.totalAnnualPension}
          annualCpp={projection.totalAnnualCpp}
          withdrawalRate={assumptions.withdrawalRate}
          retirementAge={projection.householdRetirementAge}
          showRealValues={assumptions.showRealValues}
          inflationRate={assumptions.inflationRate}
          yearsToRetirement={projection.yearsToRetirement}
          plannedGifts={assumptions.plannedGifts}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
        <RetirementProjectionCard
          currentProjectionData={projection.currentProjectionData}
          totalPortfolio={projection.totalPortfolio}
          yearsToRetirement={projection.yearsToRetirement}
          showRealValues={assumptions.showRealValues}
        />

        <GoalsCard
          currentProjectionData={projection.currentProjectionData}
          annualIncome={projection.totalAnnualIncome}
          annualPension={totalGuaranteedPension}
          replacementRate={assumptions.replacementRate}
          withdrawalRate={assumptions.withdrawalRate}
          yearsToRetirement={projection.yearsToRetirement}
          expectedReturn={assumptions.expectedReturn}
          inflationRate={assumptions.inflationRate}
          currentAnnualContributions={projection.totalAnnualContributions}
          currentPortfolio={projection.totalPortfolio}
          showRealValues={assumptions.showRealValues}
          plannedGifts={assumptions.plannedGifts}
          retirementTaxRate={assumptions.retirementTaxRate}
        />
      </div>

      <div className="card p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Income Sources Explained
        </h3>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-800 dark:text-gray-200">Portfolio Withdrawal:</strong>{' '}
            The {assumptions.withdrawalRate}% safe withdrawal rate is a common rule of thumb for sustainable retirement income from investments.
          </div>
          <div>
            <strong className="text-gray-800 dark:text-gray-200">CPP (Canada Pension Plan):</strong>{' '}
            Government pension based on your contributions during working years. Maximum in 2026 is about $1,508/month.
          </div>
          <div>
            <strong className="text-gray-800 dark:text-gray-200">OAS (Old Age Security):</strong>{' '}
            Government benefit available at age 65. Maximum in 2026 is about $752/month. Clawed back at high income levels (starting ~$95k).
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
