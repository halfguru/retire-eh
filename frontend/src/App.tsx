import { useMemo, useState, useEffect, useCallback } from 'react'
import './App.css'
import { useDarkMode } from '@/hooks/useDarkMode'
import { usePeopleManagement } from '@/hooks/usePeopleManagement'
import { useProjection } from '@/hooks/useProjection'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Tabs } from '@/components/Tabs'
import { PlanTab } from '@/components/dashboard/PlanTab'
import { OverviewTab } from '@/components/dashboard/OverviewTab'
import { ProjectionsTab } from '@/components/dashboard/ProjectionsTab'
import { IncomeTab } from '@/components/dashboard/IncomeTab'
import { LearnTab } from '@/components/dashboard/LearnTab'
import { exportToYAML, downloadYAML, uploadYAML } from '@/lib/yaml-utils'

type TabId = 'overview' | 'plan' | 'projections' | 'income' | 'learn'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('plan')
  const [isDarkMode, setIsDarkMode] = useDarkMode()

  const [showRealValues, setShowRealValues] = useState(() => {
    const saved = localStorage.getItem('showRealValues')
    return saved !== null ? saved === 'true' : true
  })

  const [expectedReturn, setExpectedReturn] = useState(() => {
    const saved = localStorage.getItem('expectedReturn')
    return saved !== null ? parseFloat(saved) : 7.0
  })

  const [inflationRate, setInflationRate] = useState(() => {
    const saved = localStorage.getItem('inflationRate')
    return saved !== null ? parseFloat(saved) : 2.5
  })

  const [replacementRate, setReplacementRate] = useState(() => {
    const saved = localStorage.getItem('replacementRate')
    return saved !== null ? parseFloat(saved) : 70
  })

  const [withdrawalRate, setWithdrawalRate] = useState(() => {
    const saved = localStorage.getItem('withdrawalRate')
    return saved !== null ? parseFloat(saved) : 4.0
  })

  const [portfolioPersonId, setPortfolioPersonId] = useState<string | null>(() => {
    const saved = localStorage.getItem('people')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed[0]?.id || null
      } catch {
        return '1'
      }
    }
    return '1'
  })

  const {
    people,
    setPeople,
    selectedPersonId,
    setSelectedPersonId,
    addPerson,
    deletePerson,
    updatePerson,
    updatePersonAnnualIncome,
    updatePersonAnnualPension,
    addAccount,
    deleteAccount,
    updateAccountBalance,
    updateAccountContribution
  } = usePeopleManagement()

  const { calculateProjection } = useProjection()

  const saveToLocalStorage = useCallback(() => {
    people.forEach((person, idx) => {
      localStorage.setItem(`person_${idx}_currentAge`, String(person.currentAge))
      localStorage.setItem(`person_${idx}_retirementAge`, String(person.retirementAge))
      localStorage.setItem(`person_${idx}_annualPension`, String(person.annualPension || 0))
      person.accounts.forEach((account) => {
        localStorage.setItem(`account_${account.id}_balance`, String(account.balance))
        localStorage.setItem(`account_${account.id}_annualContribution`, String(account.annualContribution))
      })
    })
    localStorage.setItem('people', JSON.stringify(people))
    localStorage.setItem('expectedReturn', String(expectedReturn))
    localStorage.setItem('inflationRate', String(inflationRate))
    localStorage.setItem('showRealValues', String(showRealValues))
    localStorage.setItem('replacementRate', String(replacementRate))
    localStorage.setItem('withdrawalRate', String(withdrawalRate))
  }, [people, expectedReturn, inflationRate, showRealValues, replacementRate, withdrawalRate])

  useEffect(() => {
    saveToLocalStorage()
  }, [saveToLocalStorage])

  const effectivePortfolioPersonId = useMemo(() => {
    if (people.length === 0) return null
    if (portfolioPersonId === null) return null
    const isValid = people.some(p => p.id === portfolioPersonId)
    return isValid ? portfolioPersonId : null
  }, [people, portfolioPersonId])

  const householdRetirementAge = Math.max(...people.map(p => p.retirementAge))
  const yearsToRetirement = householdRetirementAge - Math.min(...people.map(p => p.currentAge))
  const totalAnnualIncome = people.reduce((sum, p) => sum + (p.annualIncome || 0), 0)
  const totalAnnualPension = people.reduce((sum, p) => sum + (p.annualPension || 0), 0)
  const allAccounts = people.flatMap(p => p.accounts)
  const totalPortfolio = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalAnnualContributions = allAccounts.reduce((sum, acc) => sum + (acc.annualContribution || 0), 0)
  const selectedPortfolioPerson = effectivePortfolioPersonId ? people.find(p => p.id === effectivePortfolioPersonId) : undefined
  const selectedPersonAccounts = useMemo(() => selectedPortfolioPerson?.accounts || [], [selectedPortfolioPerson])
  const selectedPersonPortfolio = useMemo(() => selectedPersonAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0), [selectedPersonAccounts])

  const portfolioView = effectivePortfolioPersonId ? 'individual' : 'combined'

  const projectionData = useMemo(() => {
    const youngestAge = Math.min(...people.map(p => p.currentAge))
    return calculateProjection(allAccounts, householdRetirementAge, youngestAge, expectedReturn, inflationRate, showRealValues, yearsToRetirement)
  }, [allAccounts, householdRetirementAge, expectedReturn, inflationRate, showRealValues, calculateProjection, yearsToRetirement, people])

  const individualProjectionData = useMemo(() => {
    if (!selectedPortfolioPerson) return []
    const baseAge = selectedPortfolioPerson.currentAge
    return calculateProjection(selectedPersonAccounts, selectedPortfolioPerson.retirementAge, baseAge, expectedReturn, inflationRate, showRealValues, yearsToRetirement)
  }, [selectedPortfolioPerson, selectedPersonAccounts, expectedReturn, inflationRate, showRealValues, calculateProjection, yearsToRetirement])

  const currentProjectionData = portfolioView === 'combined' ? projectionData : individualProjectionData

  const realProjectionData = useMemo(() => {
    if (portfolioView === 'combined') {
      const youngestAge = Math.min(...people.map(p => p.currentAge))
      return calculateProjection(allAccounts, householdRetirementAge, youngestAge, expectedReturn, inflationRate, true, yearsToRetirement)
    } else if (selectedPortfolioPerson) {
      const baseAge = selectedPortfolioPerson.currentAge
      return calculateProjection(selectedPersonAccounts, selectedPortfolioPerson.retirementAge, baseAge, expectedReturn, inflationRate, true, yearsToRetirement)
    }
    return []
  }, [allAccounts, householdRetirementAge, expectedReturn, inflationRate, calculateProjection, yearsToRetirement, people, portfolioView, selectedPortfolioPerson, selectedPersonAccounts])

  const handleExport = () => {
    const yamlContent = exportToYAML(
      {
        expectedReturn,
        inflationRate,
        replacementRate,
        withdrawalRate,
        showRealValues
      },
      people
    )
    const date = new Date().toISOString().split('T')[0]
    downloadYAML(yamlContent, `retirement-plan-${date}.yaml`)
  }

  const handleImport = async () => {
    const plan = await uploadYAML()
    if (!plan) return

    setExpectedReturn(plan.assumptions.expectedReturn)
    setInflationRate(plan.assumptions.inflationRate)
    setReplacementRate(plan.assumptions.replacementRate)
    setWithdrawalRate(plan.assumptions.withdrawalRate)
    setShowRealValues(plan.assumptions.showRealValues)

    setPeople(plan.people)
    if (plan.people.length > 0) {
      setSelectedPersonId(plan.people[0].id)
    }
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'plan':
        return (
          <PlanTab
            people={people}
            selectedPersonId={selectedPersonId}
            onSelectPerson={setSelectedPersonId}
            onUpdatePerson={updatePerson}
            onUpdatePersonAnnualIncome={updatePersonAnnualIncome}
            onUpdatePersonAnnualPension={updatePersonAnnualPension}
            onDeletePerson={deletePerson}
            onAddPerson={addPerson}
            onAddAccount={addAccount}
            onDeleteAccount={deleteAccount}
            onUpdateAccountBalance={updateAccountBalance}
            onUpdateAccountContribution={updateAccountContribution}
            expectedReturn={expectedReturn}
            setExpectedReturn={setExpectedReturn}
            inflationRate={inflationRate}
            setInflationRate={setInflationRate}
            replacementRate={replacementRate}
            setReplacementRate={setReplacementRate}
            withdrawalRate={withdrawalRate}
            setWithdrawalRate={setWithdrawalRate}
          />
        )
      case 'overview':
        return (
          <OverviewTab
            people={people}
            currentProjectionData={currentProjectionData}
            realProjectionData={realProjectionData}
            totalPortfolio={totalPortfolio}
            selectedPersonPortfolio={selectedPersonPortfolio}
            allAccounts={allAccounts}
            selectedPersonAccounts={selectedPersonAccounts}
            selectedPortfolioPerson={selectedPortfolioPerson}
            portfolioPersonId={effectivePortfolioPersonId}
            onPersonChange={setPortfolioPersonId}
            yearsToRetirement={yearsToRetirement}
            totalAnnualIncome={totalAnnualIncome}
            totalAnnualPension={totalAnnualPension}
            replacementRate={replacementRate}
            withdrawalRate={withdrawalRate}
            expectedReturn={expectedReturn}
            inflationRate={inflationRate}
            currentAnnualContributions={totalAnnualContributions}
            householdRetirementAge={householdRetirementAge}
          />
        )
      case 'projections':
        return (
          <ProjectionsTab
            isDarkMode={isDarkMode}
            portfolioView={portfolioView}
            selectedPortfolioPerson={selectedPortfolioPerson}
            currentProjectionData={currentProjectionData}
            yearsToRetirement={yearsToRetirement}
          />
        )
      case 'income':
        return (
          <IncomeTab
            currentProjectionData={realProjectionData}
            annualPension={totalAnnualPension}
            withdrawalRate={withdrawalRate}
            householdRetirementAge={householdRetirementAge}
          />
        )
      case 'learn':
        return <LearnTab />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        isDarkMode={isDarkMode}
        showRealValues={showRealValues}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleRealValues={() => setShowRealValues(!showRealValues)}
        onExport={handleExport}
        onImport={handleImport}
      />
      <Tabs activeTab={activeTab} onChange={(tab) => setActiveTab(tab as TabId)} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:py-8">
        {renderTab()}
      </main>
      <Footer />
    </div>
  )
}

export default App
