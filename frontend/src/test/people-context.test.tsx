import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { PeopleProvider, usePeople } from '@/contexts/PeopleContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return <PeopleProvider>{children}</PeopleProvider>
}

describe('PeopleContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides default people on first load', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })
    expect(result.current.people.length).toBeGreaterThanOrEqual(1)
    expect(result.current.people[0].name).toBe('You')
    expect(result.current.selectedPersonId).toBe(result.current.people[0].id)
  })

  it('adds a person and selects it', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })
    const initialCount = result.current.people.length

    act(() => {
      result.current.addPerson()
    })

    expect(result.current.people.length).toBe(initialCount + 1)
    expect(result.current.selectedPersonId).toBe(result.current.people[result.current.people.length - 1].id)
  })

  it('deletes a person', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })

    act(() => {
      result.current.addPerson()
    })
    const idToDelete = result.current.people[result.current.people.length - 1].id
    const countBefore = result.current.people.length

    act(() => {
      result.current.deletePerson(idToDelete)
    })

    expect(result.current.people.length).toBe(countBefore - 1)
    expect(result.current.people.find(p => p.id === idToDelete)).toBeUndefined()
  })

  it('updates a person field', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })
    const personId = result.current.people[0].id

    act(() => {
      result.current.updatePerson(personId, 'name', 'Updated Name')
    })

    expect(result.current.people[0].name).toBe('Updated Name')
  })

  it('updates person annual income', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })
    const personId = result.current.people[0].id

    act(() => {
      result.current.updatePersonAnnualIncome(personId, 150000)
    })

    expect(result.current.people[0].annualIncome).toBe(150000)
  })

  it('updates person annual pension', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })
    const personId = result.current.people[0].id

    act(() => {
      result.current.updatePersonAnnualPension(personId, 25000)
    })

    expect(result.current.people[0].annualPension).toBe(25000)
  })

  it('adds and deletes an account', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })
    const personId = result.current.people[0].id
    const initialAccounts = result.current.people[0].accounts.length

    act(() => {
      result.current.addAccount(personId, 'RRSP')
    })

    const person = result.current.people.find(p => p.id === personId)!
    expect(person.accounts.length).toBe(initialAccounts + 1)
    expect(person.accounts[person.accounts.length - 1].type).toBe('RRSP')

    const accountId = person.accounts[person.accounts.length - 1].id

    act(() => {
      result.current.deleteAccount(personId, accountId)
    })

    const updatedPerson = result.current.people.find(p => p.id === personId)!
    expect(updatedPerson.accounts.length).toBe(initialAccounts)
  })

  it('updates account balance', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })
    const personId = result.current.people[0].id
    const accountId = result.current.people[0].accounts[0].id

    act(() => {
      result.current.updateAccountBalance(personId, accountId, 250000)
    })

    const account = result.current.people.find(p => p.id === personId)!.accounts.find(a => a.id === accountId)!
    expect(account.balance).toBe(250000)
  })

  it('updates account contribution', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })
    const personId = result.current.people[0].id
    const accountId = result.current.people[0].accounts[0].id

    act(() => {
      result.current.updateAccountContribution(personId, accountId, 15000)
    })

    const account = result.current.people.find(p => p.id === personId)!.accounts.find(a => a.id === accountId)!
    expect(account.annualContribution).toBe(15000)
  })

  it('selects a different person', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })

    act(() => {
      result.current.addPerson()
    })
    const secondPersonId = result.current.people[1].id

    act(() => {
      result.current.setSelectedPersonId(secondPersonId)
    })

    expect(result.current.selectedPersonId).toBe(secondPersonId)
  })

  it('falls back to first person when selected person is deleted', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })

    act(() => {
      result.current.addPerson()
    })
    const secondPersonId = result.current.people[1].id

    act(() => {
      result.current.setSelectedPersonId(secondPersonId)
    })

    act(() => {
      result.current.deletePerson(secondPersonId)
    })

    expect(result.current.selectedPersonId).toBe(result.current.people[0].id)
  })

  it('sets all people at once (for import)', () => {
    const { result } = renderHook(() => usePeople(), { wrapper })

    const newPeople = [
      {
        id: 'import-1',
        name: 'Imported',
        currentAge: 40,
        retirementAge: 65,
        annualIncome: 200000,
        annualPension: 30000,
        accounts: [
          { id: 'acc-1', type: 'RRSP' as const, balance: 500000, annualContribution: 30000 },
        ],
      },
    ]

    act(() => {
      result.current.setPeople(newPeople)
      result.current.setSelectedPersonId('import-1')
    })

    expect(result.current.people).toEqual(newPeople)
    expect(result.current.selectedPersonId).toBe('import-1')
  })

  it('throws when usePeople is used outside provider', () => {
    expect(() => renderHook(() => usePeople())).toThrow('usePeople must be used within PeopleProvider')
  })
})
