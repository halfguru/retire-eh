import { createContext, useContext, useState, type ReactNode } from 'react'
import type { PlanAssumptions } from '@/types/plan'

interface AssumptionsContextValue extends PlanAssumptions {
  setExpectedReturn: (v: number) => void
  setInflationRate: (v: number) => void
  setReplacementRate: (v: number) => void
  setWithdrawalRate: (v: number) => void
  setShowRealValues: (v: boolean) => void
}

const AssumptionsContext = createContext<AssumptionsContextValue | null>(null)

function loadNumber(key: string, fallback: number): number {
  const saved = localStorage.getItem(key)
  return saved !== null ? parseFloat(saved) : fallback
}

function loadBoolean(key: string, fallback: boolean): boolean {
  const saved = localStorage.getItem(key)
  return saved !== null ? saved === 'true' : fallback
}

export function AssumptionsProvider({ children }: { children: ReactNode }) {
  const [expectedReturn, setExpectedReturn] = useState(() => loadNumber('expectedReturn', 7.0))
  const [inflationRate, setInflationRate] = useState(() => loadNumber('inflationRate', 2.5))
  const [replacementRate, setReplacementRate] = useState(() => loadNumber('replacementRate', 70))
  const [withdrawalRate, setWithdrawalRate] = useState(() => loadNumber('withdrawalRate', 4.0))
  const [showRealValues, setShowRealValues] = useState(() => loadBoolean('showRealValues', true))

  return (
    <AssumptionsContext.Provider value={{
      expectedReturn, setExpectedReturn,
      inflationRate, setInflationRate,
      replacementRate, setReplacementRate,
      withdrawalRate, setWithdrawalRate,
      showRealValues, setShowRealValues,
    }}>
      {children}
    </AssumptionsContext.Provider>
  )
}

export function useAssumptions() {
  const ctx = useContext(AssumptionsContext)
  if (!ctx) throw new Error('useAssumptions must be used within AssumptionsProvider')
  return ctx
}
