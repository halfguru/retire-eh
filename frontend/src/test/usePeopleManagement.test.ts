import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePeopleManagement } from '@/hooks/usePeopleManagement'

describe('usePeopleManagement', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns a default person when localStorage is empty', () => {
    const { result } = renderHook(() => usePeopleManagement())
    expect(result.current.people).toHaveLength(1)
    expect(result.current.people[0].name).toBe('You')
    expect(result.current.people[0].accounts).toHaveLength(2)
  })

  it('adds a new person with crypto.randomUUID', () => {
    const { result } = renderHook(() => usePeopleManagement())
    act(() => {
      result.current.addPerson()
    })
    expect(result.current.people).toHaveLength(2)
    expect(result.current.people[1].name).toBe('Person 2')
    expect(result.current.people[1].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
  })

  it('deletes a person', () => {
    const { result } = renderHook(() => usePeopleManagement())
    act(() => {
      result.current.addPerson()
    })
    const personId = result.current.people[1].id
    act(() => {
      result.current.deletePerson(personId)
    })
    expect(result.current.people).toHaveLength(1)
  })

  it('updates a person field', () => {
    const { result } = renderHook(() => usePeopleManagement())
    const personId = result.current.people[0].id
    act(() => {
      result.current.updatePerson(personId, 'name', 'Alice')
    })
    expect(result.current.people[0].name).toBe('Alice')
  })

  it('adds an account with crypto.randomUUID', () => {
    const { result } = renderHook(() => usePeopleManagement())
    const personId = result.current.people[0].id
    act(() => {
      result.current.addAccount(personId, 'RRSP')
    })
    const person = result.current.people[0]
    expect(person.accounts).toHaveLength(3)
    const newAccount = person.accounts[2]
    expect(newAccount.type).toBe('RRSP')
    expect(newAccount.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
  })

  it('deletes an account', () => {
    const { result } = renderHook(() => usePeopleManagement())
    const personId = result.current.people[0].id
    const accountId = result.current.people[0].accounts[0].id
    act(() => {
      result.current.deleteAccount(personId, accountId)
    })
    expect(result.current.people[0].accounts).toHaveLength(1)
  })

  it('updates account balance', () => {
    const { result } = renderHook(() => usePeopleManagement())
    const personId = result.current.people[0].id
    const accountId = result.current.people[0].accounts[0].id
    act(() => {
      result.current.updateAccountBalance(personId, accountId, 50000)
    })
    expect(result.current.people[0].accounts[0].balance).toBe(50000)
  })

  it('updates account contribution', () => {
    const { result } = renderHook(() => usePeopleManagement())
    const personId = result.current.people[0].id
    const accountId = result.current.people[0].accounts[0].id
    act(() => {
      result.current.updateAccountContribution(personId, accountId, 5000)
    })
    expect(result.current.people[0].accounts[0].annualContribution).toBe(5000)
  })

  it('updates annual income', () => {
    const { result } = renderHook(() => usePeopleManagement())
    const personId = result.current.people[0].id
    act(() => {
      result.current.updatePersonAnnualIncome(personId, 120000)
    })
    expect(result.current.people[0].annualIncome).toBe(120000)
  })

  it('updates annual pension', () => {
    const { result } = renderHook(() => usePeopleManagement())
    const personId = result.current.people[0].id
    act(() => {
      result.current.updatePersonAnnualPension(personId, 15000)
    })
    expect(result.current.people[0].annualPension).toBe(15000)
  })

  it('loads people from localStorage', () => {
    const storedPeople = [{
      id: 'stored-1',
      name: 'Bob',
      currentAge: 40,
      retirementAge: 65,
      annualIncome: 80000,
      annualPension: 0,
      accounts: []
    }]
    localStorage.setItem('people', JSON.stringify(storedPeople))

    const { result } = renderHook(() => usePeopleManagement())
    expect(result.current.people).toHaveLength(1)
    expect(result.current.people[0].name).toBe('Bob')
  })

  it('falls back to default when localStorage has invalid JSON', () => {
    localStorage.setItem('people', 'not-json')
    const { result } = renderHook(() => usePeopleManagement())
    expect(result.current.people).toHaveLength(1)
    expect(result.current.people[0].name).toBe('You')
  })
})
