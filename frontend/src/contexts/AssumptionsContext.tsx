import { createContext, useContext, useState, type ReactNode } from 'react'
import type { PlanAssumptions, PlannedGift } from '@/types/plan'

interface AssumptionsContextValue extends PlanAssumptions {
  setExpectedReturn: (v: number) => void
  setInflationRate: (v: number) => void
  setReplacementRate: (v: number) => void
  setWithdrawalRate: (v: number) => void
  setRetirementTaxRate: (v: number) => void
  setShowRealValues: (v: boolean) => void
  setPlannedGifts: (gifts: PlannedGift[]) => void
  addGift: (defaultAge?: number) => void
  updateGift: (id: string, patch: Partial<Omit<PlannedGift, 'id'>>) => void
  removeGift: (id: string) => void
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

function loadGifts(key: string, fallback: PlannedGift[]): PlannedGift[] {
  const saved = localStorage.getItem(key)
  if (saved === null) return fallback
  try {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // ignore malformed storage
  }
  return fallback
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function AssumptionsProvider({ children }: { children: ReactNode }) {
  const [expectedReturn, setExpectedReturn] = useState(() => loadNumber('expectedReturn', 7.0))
  const [inflationRate, setInflationRate] = useState(() => loadNumber('inflationRate', 2.5))
  const [replacementRate, setReplacementRate] = useState(() => loadNumber('replacementRate', 70))
  const [withdrawalRate, setWithdrawalRate] = useState(() => loadNumber('withdrawalRate', 4.0))
  const [retirementTaxRate, setRetirementTaxRate] = useState(() => loadNumber('retirementTaxRate', 20.0))
  const [showRealValues, setShowRealValues] = useState(() => loadBoolean('showRealValues', true))
  const [plannedGifts, setPlannedGifts] = useState<PlannedGift[]>(() => loadGifts('plannedGifts', []))

  const setPlannedGiftsExternal = (gifts: PlannedGift[]) => setPlannedGifts(gifts)

  const addGift = (defaultAge = 65) => {
    setPlannedGifts(prev => [
      ...prev,
      { id: newId(), label: 'Kid gift', amount: 50000, age: defaultAge },
    ])
  }
  const updateGift = (id: string, patch: Partial<Omit<PlannedGift, 'id'>>) => {
    setPlannedGifts(prev => prev.map(g => (g.id === id ? { ...g, ...patch } : g)))
  }
  const removeGift = (id: string) => {
    setPlannedGifts(prev => prev.filter(g => g.id !== id))
  }

  return (
    <AssumptionsContext.Provider value={{
      expectedReturn, setExpectedReturn,
      inflationRate, setInflationRate,
      replacementRate, setReplacementRate,
      withdrawalRate, setWithdrawalRate,
      retirementTaxRate, setRetirementTaxRate,
      showRealValues, setShowRealValues,
      plannedGifts, setPlannedGifts: setPlannedGiftsExternal, addGift, updateGift, removeGift,
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
