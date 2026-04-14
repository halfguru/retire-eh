import { createContext, useContext, useReducer, useState, useMemo, type ReactNode } from 'react'
import type { Person } from '@/types/person'

type PeopleAction =
  | { type: 'SET_PEOPLE'; payload: Person[] }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'DELETE_PERSON'; payload: string }
  | { type: 'UPDATE_PERSON'; payload: { id: string; field: keyof Person; value: string | number } }
  | { type: 'UPDATE_PERSON_INCOME'; payload: { personId: string; annualIncome: number } }
  | { type: 'UPDATE_PERSON_PENSION'; payload: { personId: string; annualPension: number } }
  | { type: 'ADD_ACCOUNT'; payload: { personId: string; account: Person['accounts'][number] } }
  | { type: 'DELETE_ACCOUNT'; payload: { personId: string; accountId: string } }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; payload: { personId: string; accountId: string; balance: number } }
  | { type: 'UPDATE_ACCOUNT_CONTRIBUTION'; payload: { personId: string; accountId: string; annualContribution: number } }

function peopleReducer(state: Person[], action: PeopleAction): Person[] {
  switch (action.type) {
    case 'SET_PEOPLE':
      return action.payload
    case 'ADD_PERSON':
      return [...state, action.payload]
    case 'DELETE_PERSON':
      return state.filter(p => p.id !== action.payload)
    case 'UPDATE_PERSON':
      return state.map(p => p.id === action.payload.id ? { ...p, [action.payload.field]: action.payload.value } : p)
    case 'UPDATE_PERSON_INCOME':
      return state.map(p => p.id === action.payload.personId ? { ...p, annualIncome: action.payload.annualIncome } : p)
    case 'UPDATE_PERSON_PENSION':
      return state.map(p => p.id === action.payload.personId ? { ...p, annualPension: action.payload.annualPension } : p)
    case 'ADD_ACCOUNT':
      return state.map(p => p.id === action.payload.personId ? { ...p, accounts: [...p.accounts, action.payload.account] } : p)
    case 'DELETE_ACCOUNT':
      return state.map(p => p.id === action.payload.personId ? { ...p, accounts: p.accounts.filter(a => a.id !== action.payload.accountId) } : p)
    case 'UPDATE_ACCOUNT_BALANCE':
      return state.map(p => p.id === action.payload.personId ? { ...p, accounts: p.accounts.map(a => a.id === action.payload.accountId ? { ...a, balance: action.payload.balance } : a) } : p)
    case 'UPDATE_ACCOUNT_CONTRIBUTION':
      return state.map(p => p.id === action.payload.personId ? { ...p, accounts: p.accounts.map(a => a.id === action.payload.accountId ? { ...a, annualContribution: action.payload.annualContribution } : a) } : p)
  }
}

interface PeopleContextValue {
  people: Person[]
  dispatch: React.Dispatch<PeopleAction>
  selectedPersonId: string | null
  setSelectedPersonId: (id: string | null) => void
}

const PeopleContext = createContext<PeopleContextValue | null>(null)

const defaultPeople: Person[] = [
  {
    id: '1',
    name: 'You',
    currentAge: 35,
    retirementAge: 65,
    annualIncome: 100000,
    annualPension: 0,
    accounts: [
      { id: '1-1', type: 'RRSP', balance: 100000, annualContribution: 0 },
      { id: '1-2', type: 'TFSA', balance: 80000, annualContribution: 0 },
    ]
  }
]

function getInitialPeople(): Person[] {
  const saved = localStorage.getItem('people')
  if (saved) {
    try { return JSON.parse(saved) } catch { return defaultPeople }
  }
  return defaultPeople
}

function getInitialSelectedId(people: Person[]): string | null {
  return people.length > 0 ? people[0].id : null
}

export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, dispatch] = useReducer(peopleReducer, null, getInitialPeople)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(() => getInitialSelectedId(getInitialPeople()))

  const effectiveSelectedId = useMemo(() => {
    if (people.length === 0) return null
    return people.some(p => p.id === selectedPersonId) ? selectedPersonId : people[0].id
  }, [people, selectedPersonId])

  return (
    <PeopleContext.Provider value={{ people, dispatch, selectedPersonId: effectiveSelectedId, setSelectedPersonId }}>
      {children}
    </PeopleContext.Provider>
  )
}

export function usePeople() {
  const ctx = useContext(PeopleContext)
  if (!ctx) throw new Error('usePeople must be used within PeopleProvider')

  const { people, dispatch, selectedPersonId, setSelectedPersonId } = ctx

  return {
    people,
    setPeople: (newPeople: Person[]) => dispatch({ type: 'SET_PEOPLE', payload: newPeople }),
    selectedPersonId,
    setSelectedPersonId,
    addPerson: () => {
      const newId = crypto.randomUUID()
      dispatch({ type: 'ADD_PERSON', payload: { id: newId, name: `Person ${people.length + 1}`, currentAge: 35, retirementAge: 65, annualIncome: 0, annualPension: 0, accounts: [] } })
      setSelectedPersonId(newId)
    },
    deletePerson: (id: string) => dispatch({ type: 'DELETE_PERSON', payload: id }),
    updatePerson: (id: string, field: keyof Person, value: string | number) => dispatch({ type: 'UPDATE_PERSON', payload: { id, field, value } }),
    updatePersonAnnualIncome: (personId: string, annualIncome: number) => dispatch({ type: 'UPDATE_PERSON_INCOME', payload: { personId, annualIncome } }),
    updatePersonAnnualPension: (personId: string, annualPension: number) => dispatch({ type: 'UPDATE_PERSON_PENSION', payload: { personId, annualPension } }),
    addAccount: (personId: string, type: 'RRSP' | 'TFSA') => dispatch({ type: 'ADD_ACCOUNT', payload: { personId, account: { id: crypto.randomUUID(), type, balance: 0, annualContribution: 0 } } }),
    deleteAccount: (personId: string, accountId: string) => dispatch({ type: 'DELETE_ACCOUNT', payload: { personId, accountId } }),
    updateAccountBalance: (personId: string, accountId: string, balance: number) => dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { personId, accountId, balance } }),
    updateAccountContribution: (personId: string, accountId: string, annualContribution: number) => dispatch({ type: 'UPDATE_ACCOUNT_CONTRIBUTION', payload: { personId, accountId, annualContribution } }),
  }
}
