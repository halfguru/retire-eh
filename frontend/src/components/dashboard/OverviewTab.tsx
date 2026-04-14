import { SummaryCard } from './SummaryCard'
import { ViewSelector } from './ViewSelector'
import { PortfolioCard } from './PortfolioCard'
import { RetirementProjectionCard } from './RetirementProjectionCard'
import { GoalsCard } from './GoalsCard'
import { usePeople } from '@/contexts/PeopleContext'
import { useAssumptions } from '@/contexts/AssumptionsContext'
import { useProjectionContext } from '@/contexts/ProjectionContext'

export function OverviewTab() {
  const { people } = usePeople()
  const assumptions = useAssumptions()
  const projection = useProjectionContext()

  const allAccounts = people.flatMap(p => p.accounts)

  return (
    <div className="space-y-6">
      <SummaryCard
        currentProjectionData={projection.realProjectionData}
        annualIncome={projection.totalAnnualIncome}
        annualPension={projection.totalAnnualPension}
        replacementRate={assumptions.replacementRate}
        withdrawalRate={assumptions.withdrawalRate}
        yearsToRetirement={projection.yearsToRetirement}
        expectedReturn={assumptions.expectedReturn}
        inflationRate={assumptions.inflationRate}
        currentAnnualContributions={projection.totalAnnualContributions}
        currentPortfolio={projection.totalPortfolio}
        householdRetirementAge={projection.householdRetirementAge}
      />

      <ViewSelector
        selectedPortfolioPersonId={projection.portfolioPersonId}
        people={people}
        onPersonChange={projection.setPortfolioPersonId}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <PortfolioCard
          portfolioView={projection.portfolioView}
          totalPortfolio={projection.totalPortfolio}
          selectedPersonPortfolio={projection.selectedPersonPortfolio}
          allAccounts={allAccounts}
          selectedPersonAccounts={projection.selectedPersonAccounts}
          selectedPortfolioPerson={projection.selectedPortfolioPerson}
        />

        <RetirementProjectionCard
          portfolioView={projection.portfolioView}
          currentProjectionData={projection.currentProjectionData}
          totalPortfolio={projection.totalPortfolio}
          selectedPersonPortfolio={projection.selectedPersonPortfolio}
          yearsToRetirement={projection.yearsToRetirement}
        />
      </div>

      <GoalsCard
        currentProjectionData={projection.realProjectionData}
        annualIncome={projection.totalAnnualIncome}
        annualPension={projection.totalAnnualPension}
        replacementRate={assumptions.replacementRate}
        withdrawalRate={assumptions.withdrawalRate}
        yearsToRetirement={projection.yearsToRetirement}
        expectedReturn={assumptions.expectedReturn}
        inflationRate={assumptions.inflationRate}
        currentAnnualContributions={projection.totalAnnualContributions}
        currentPortfolio={projection.totalPortfolio}
      />
    </div>
  )
}
