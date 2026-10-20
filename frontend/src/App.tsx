import { useState, useCallback } from 'react'
import './App.css'
import { useDarkMode } from '@/hooks/useDarkMode'
import { PeopleProvider, usePeople } from '@/contexts/PeopleContext'
import { AssumptionsProvider, useAssumptions } from '@/contexts/AssumptionsContext'
import { ProjectionProvider } from '@/contexts/ProjectionContext'
import { usePersistence } from '@/hooks/usePersistence'
import { exportToYAML, downloadYAML, uploadYAML } from '@/lib/yaml-utils'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Tabs } from '@/components/Tabs'
import { PlanTab } from '@/components/dashboard/PlanTab'
import { OverviewTab } from '@/components/dashboard/OverviewTab'
import { ProjectionsTab } from '@/components/dashboard/ProjectionsTab'
import { LearnTab } from '@/components/dashboard/LearnTab'
import { ErrorBoundary } from '@/components/ErrorBoundary'

type TabId = 'overview' | 'plan' | 'projections' | 'learn'

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('plan')
  const [isDarkMode, setIsDarkMode] = useDarkMode()
  const peopleApi = usePeople()
  const assumptions = useAssumptions()
  const { localStorageError, setLocalStorageError } = usePersistence()

  const handleExport = useCallback(() => {
    const yamlContent = exportToYAML(
      {
        expectedReturn: assumptions.expectedReturn,
        inflationRate: assumptions.inflationRate,
        replacementRate: assumptions.replacementRate,
        withdrawalRate: assumptions.withdrawalRate,
        retirementTaxRate: assumptions.retirementTaxRate,
        showRealValues: assumptions.showRealValues,
        plannedGifts: assumptions.plannedGifts,
      },
      peopleApi.people
    )
    const date = new Date().toISOString().split('T')[0]
    downloadYAML(yamlContent, `retirement-plan-${date}.yaml`)
  }, [assumptions, peopleApi.people])

  const handleImport = useCallback(async () => {
    const plan = await uploadYAML()
    if (!plan) return
    assumptions.setExpectedReturn(plan.assumptions.expectedReturn)
    assumptions.setInflationRate(plan.assumptions.inflationRate)
    assumptions.setReplacementRate(plan.assumptions.replacementRate)
    assumptions.setWithdrawalRate(plan.assumptions.withdrawalRate)
    assumptions.setRetirementTaxRate(plan.assumptions.retirementTaxRate)
    assumptions.setShowRealValues(plan.assumptions.showRealValues)
    assumptions.setPlannedGifts(plan.assumptions.plannedGifts ?? [])
    peopleApi.setPeople(plan.people)
    if (plan.people.length > 0) {
      peopleApi.setSelectedPersonId(plan.people[0].id)
    }
  }, [assumptions, peopleApi])

  const renderTab = () => {
    switch (activeTab) {
      case 'plan':
        return <PlanTab />
      case 'overview':
        return <OverviewTab />
      case 'projections':
        return <ProjectionsTab />
      case 'learn':
        return <LearnTab />
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Header
        isDarkMode={isDarkMode}
        showRealValues={assumptions.showRealValues}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleRealValues={() => assumptions.setShowRealValues(!assumptions.showRealValues)}
        onExport={handleExport}
        onImport={handleImport}
      />
      <Tabs activeTab={activeTab} onChange={(tab) => setActiveTab(tab as TabId)} />
      {localStorageError && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-2">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
            <span>{localStorageError}</span>
            <button
              onClick={() => setLocalStorageError(null)}
              className="ml-3 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:py-8">
        <ErrorBoundary>
          {renderTab()}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <PeopleProvider>
      <AssumptionsProvider>
        <ProjectionProvider>
          <AppContent />
        </ProjectionProvider>
      </AssumptionsProvider>
    </PeopleProvider>
  )
}
