import { SummaryCard } from './SummaryCard'
import { ViewSelector } from './ViewSelector'
import { PortfolioCard } from './PortfolioCard'
import { RetirementProjectionCard } from './RetirementProjectionCard'
import { GoalsCard } from './GoalsCard'
import type { Person, Account } from '@/hooks/usePeopleManagement'
import type { ProjectionDataPoint } from '@/hooks/useProjection'

interface OverviewTabProps {
  people: Person[]
  currentProjectionData: ProjectionDataPoint[]
  realProjectionData: ProjectionDataPoint[]
  totalPortfolio: number
  selectedPersonPortfolio: number
  allAccounts: Account[]
  selectedPersonAccounts: Account[]
  selectedPortfolioPerson: Person | undefined
  portfolioPersonId: string | null
  onPersonChange: (id: string | null) => void
  yearsToRetirement: number
  totalAnnualIncome: number
  totalAnnualPension: number
  replacementRate: number
  withdrawalRate: number
  expectedReturn: number
  inflationRate: number
  currentAnnualContributions: number
  householdRetirementAge: number
}

export function OverviewTab({
  people,
  currentProjectionData,
  realProjectionData,
  totalPortfolio,
  selectedPersonPortfolio,
  allAccounts,
  selectedPersonAccounts,
  selectedPortfolioPerson,
  portfolioPersonId,
  onPersonChange,
  yearsToRetirement,
  totalAnnualIncome,
  totalAnnualPension,
  replacementRate,
  withdrawalRate,
  expectedReturn,
  inflationRate,
  currentAnnualContributions,
  householdRetirementAge
}: OverviewTabProps) {
  const portfolioView = portfolioPersonId ? 'individual' : 'combined'

  return (
    <div className="space-y-6">
      <SummaryCard
        currentProjectionData={realProjectionData}
        annualIncome={totalAnnualIncome}
        annualPension={totalAnnualPension}
        replacementRate={replacementRate}
        withdrawalRate={withdrawalRate}
        yearsToRetirement={yearsToRetirement}
        expectedReturn={expectedReturn}
        inflationRate={inflationRate}
        currentAnnualContributions={currentAnnualContributions}
        currentPortfolio={totalPortfolio}
        householdRetirementAge={householdRetirementAge}
      />

      <ViewSelector
        selectedPortfolioPersonId={portfolioPersonId}
        people={people}
        onPersonChange={onPersonChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <PortfolioCard
          portfolioView={portfolioView}
          totalPortfolio={totalPortfolio}
          selectedPersonPortfolio={selectedPersonPortfolio}
          allAccounts={allAccounts}
          selectedPersonAccounts={selectedPersonAccounts}
          selectedPortfolioPerson={selectedPortfolioPerson}
        />

        <RetirementProjectionCard
          portfolioView={portfolioView}
          currentProjectionData={currentProjectionData}
          totalPortfolio={totalPortfolio}
          selectedPersonPortfolio={selectedPersonPortfolio}
          yearsToRetirement={yearsToRetirement}
        />
      </div>

      <GoalsCard
        currentProjectionData={realProjectionData}
        annualIncome={totalAnnualIncome}
        annualPension={totalAnnualPension}
        replacementRate={replacementRate}
        withdrawalRate={withdrawalRate}
        yearsToRetirement={yearsToRetirement}
        expectedReturn={expectedReturn}
        inflationRate={inflationRate}
        currentAnnualContributions={currentAnnualContributions}
        currentPortfolio={totalPortfolio}
      />
    </div>
  )
}
