import { useCallback, useEffect, useState } from 'react'
import { usePeople } from '@/contexts/PeopleContext'
import { useAssumptions } from '@/contexts/AssumptionsContext'

export function usePersistence() {
  const { people } = usePeople()
  const { expectedReturn, inflationRate, replacementRate, withdrawalRate, showRealValues } = useAssumptions()
  const [localStorageError, setLocalStorageError] = useState<string | null>(null)

  const saveToLocalStorage = useCallback(() => {
    try {
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
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'QuotaExceededError'
        ? 'Storage is full. Your data could not be saved. Try removing old data or exporting your plan.'
        : 'Failed to save data. Your changes may not persist.'
      console.error('localStorage write failed:', error)
      return message
    }
    return null
  }, [people, expectedReturn, inflationRate, showRealValues, replacementRate, withdrawalRate])

  useEffect(() => {
    const error = saveToLocalStorage()
    if (error) {
      queueMicrotask(() => setLocalStorageError(error))
    }
  }, [saveToLocalStorage])

  return { localStorageError, setLocalStorageError }
}
