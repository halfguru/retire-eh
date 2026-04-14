import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import { usePeople } from './PeopleContext'
import { useAssumptions } from './AssumptionsContext'
import { useProjection } from '@/hooks/useProjection'

import type { ProjectionDataPoint } from '@/types/projection'

interface ProjectionContextValueTyped {
  wasmLoaded: boolean
  wasmError: string | null
  portfolioPersonId: string | null
  setPortfolioPersonId: (id: string | null) => void
  projectionData: ProjectionDataPoint[]
  individualProjectionData: ProjectionDataPoint[]
  currentProjectionData: ProjectionDataPoint[]
  realProjectionData: ProjectionDataPoint[]
  householdRetirementAge: number
  yearsToRetirement: number
  totalAnnualIncome: number
  totalAnnualPension: number
  totalPortfolio: number
  totalAnnualContributions: number
  selectedPersonPortfolio: number
  selectedPersonAccounts: import('@/types/person').Account[]
  selectedPortfolioPerson: import('@/types/person').Person | undefined
  portfolioView: 'combined' | 'individual'
}

const ProjectionContext = createContext<ProjectionContextValueTyped | null>(null)

export function ProjectionProvider({ children }: { children: ReactNode }) {
  const { people } = usePeople()
  const { expectedReturn, inflationRate, showRealValues } = useAssumptions()
  const { wasmLoaded, wasmError, calculateProjection } = useProjection()

  const [portfolioPersonId, setPortfolioPersonId] = useState<string | null>(() => {
    const saved = localStorage.getItem('people')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed[0]?.id || null
      } catch { return '1' }
    }
    return '1'
  })

  const effectivePortfolioPersonId = useMemo(() => {
    if (people.length === 0) return null
    if (portfolioPersonId === null) return null
    return people.some(p => p.id === portfolioPersonId) ? portfolioPersonId : null
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

  return (
    <ProjectionContext.Provider value={{
      wasmLoaded, wasmError,
      portfolioPersonId: effectivePortfolioPersonId, setPortfolioPersonId,
      projectionData, individualProjectionData, currentProjectionData, realProjectionData,
      householdRetirementAge, yearsToRetirement,
      totalAnnualIncome, totalAnnualPension,
      totalPortfolio, totalAnnualContributions,
      selectedPersonPortfolio, selectedPersonAccounts, selectedPortfolioPerson,
      portfolioView,
    }}>
      {children}
    </ProjectionContext.Provider>
  )
}

export function useProjectionContext() {
  const ctx = useContext(ProjectionContext)
  if (!ctx) throw new Error('useProjectionContext must be used within ProjectionProvider')
  return ctx
}
