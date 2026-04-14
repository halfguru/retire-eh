import { useState, useMemo } from 'react'

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : value
  return num.toLocaleString('en-CA')
}

export interface Account {
  id: string
  type: 'RRSP' | 'TFSA'
  balance: number
  annualContribution: number
}

export interface Person {
  id: string
  name: string
  currentAge: number
  retirementAge: number
  annualIncome: number
  annualPension: number
  accounts: Account[]
}

const defaultPerson: Person = {
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

export function usePeopleManagement() {
  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem('people')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return [defaultPerson]
      }
    }
    return [defaultPerson]
  })

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(() => {
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

  const effectiveSelectedPersonId = useMemo(() => {
    if (people.length === 0) return null
    const isValid = people.some(p => p.id === selectedPersonId)
    return isValid ? selectedPersonId : people[0].id
  }, [people, selectedPersonId])

  const addPerson = () => {
    const newId = crypto.randomUUID()
    const newPerson: Person = {
      id: newId,
      name: `Person ${people.length + 1}`,
      currentAge: 35,
      retirementAge: 65,
      annualIncome: 0,
      annualPension: 0,
      accounts: []
    }
    setPeople([...people, newPerson])
    setSelectedPersonId(newId)
  }

  const deletePerson = (id: string) => {
    setPeople(people.filter(p => p.id !== id))
  }

  const updatePerson = (id: string, field: keyof Person, value: string | number) => {
    setPeople(people.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const addAccount = (personId: string, type: 'RRSP' | 'TFSA') => {
    setPeople(people.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          accounts: [...p.accounts, { id: crypto.randomUUID(), type, balance: 0, annualContribution: 0 }]
        }
      }
      return p
    }))
  }

  const deleteAccount = (personId: string, accountId: string) => {
    setPeople(people.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          accounts: p.accounts.filter(acc => acc.id !== accountId)
        }
      }
      return p
    }))
  }

  const updateAccountBalance = (personId: string, accountId: string, balance: number) => {
    setPeople(people.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          accounts: p.accounts.map(acc => acc.id === accountId ? { ...acc, balance } : acc)
        }
      }
      return p
    }))
  }

  const updateAccountContribution = (personId: string, accountId: string, annualContribution: number) => {
    setPeople(people.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          accounts: p.accounts.map(acc => acc.id === accountId ? { ...acc, annualContribution } : acc)
        }
      }
      return p
    }))
  }

  const updatePersonAnnualIncome = (personId: string, annualIncome: number) => {
    setPeople(people.map(p => p.id === personId ? { ...p, annualIncome } : p))
  }

  const updatePersonAnnualPension = (personId: string, annualPension: number) => {
    setPeople(people.map(p => p.id === personId ? { ...p, annualPension } : p))
  }

  const getCurrentPerson = () => people.find(p => p.id === effectiveSelectedPersonId) || people[0]

  return {
    people,
    setPeople,
    selectedPersonId: effectiveSelectedPersonId,
    setSelectedPersonId,
    addPerson,
    deletePerson,
    updatePerson,
    updatePersonAnnualIncome,
    updatePersonAnnualPension,
    addAccount,
    deleteAccount,
    updateAccountBalance,
    updateAccountContribution,
    getCurrentPerson
  }
}
