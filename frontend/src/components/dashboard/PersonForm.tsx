import { useState, useEffect, useRef } from 'react'
import type { Person } from '@/types/household'
import { InfoTooltip } from './InfoTooltip'
import { AccountCard } from './AccountCard'
import { NumberInput } from '@/components/ui/NumberInput'
import { validateAge, validateRetirementAge } from '@/lib/validation'

interface PersonFormProps {
  people: Person[]
  selectedPersonId: string | null
  onSelect: (id: string) => void
  onUpdatePerson: (id: string, field: keyof Person, value: string | number) => void
  onUpdatePersonAnnualIncome: (personId: string, annualIncome: number) => void
  onUpdatePersonAnnualPension: (personId: string, annualPension: number) => void
  onDeletePerson: (id: string) => void
  onAddAccount: (personId: string, type: 'RRSP' | 'TFSA') => void
  onDeleteAccount: (personId: string, accountId: string) => void
  onUpdateAccountBalance: (personId: string, accountId: string, balance: number) => void
  onUpdateAccountContribution: (personId: string, accountId: string, contribution: number) => void
}

export function PersonForm({
  people,
  selectedPersonId,
  onSelect,
  onUpdatePerson,
  onUpdatePersonAnnualIncome,
  onUpdatePersonAnnualPension,
  onDeletePerson,
  onAddAccount,
  onDeleteAccount,
  onUpdateAccountBalance,
  onUpdateAccountContribution
}: PersonFormProps) {
  const [showAddMenu, setShowAddMenu] = useState<null | string>(null)
  const menuContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (people.length > 0 && (!selectedPersonId || !people.find(p => p.id === selectedPersonId))) {
      onSelect(people[0].id)
    }
  }, [people, selectedPersonId, onSelect])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (menuContainerRef.current && !menuContainerRef.current.contains(target) && !target.closest('[data-add-menu-trigger]')) {
        setShowAddMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const person = people.find(p => p.id === selectedPersonId) || people[0]
  if (!person) return null

  const canDeletePerson = people.length > 1

  return (
    <div ref={menuContainerRef} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
        <input
          type="text"
          value={person.name}
          onChange={(e) => onUpdatePerson(person.id, 'name', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Annual Income
            <InfoTooltip text="Annual income before retirement" />
          </label>
          <NumberInput
            value={person.annualIncome || 0}
            onChange={(val) => onUpdatePersonAnnualIncome(person.id, val)}
            step={5000}
            min={0}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Pension (CPP/Employer)
            <InfoTooltip text="Expected annual pension at retirement" />
          </label>
          <NumberInput
            value={person.annualPension || 0}
            onChange={(val) => onUpdatePersonAnnualPension(person.id, val)}
            step={1000}
            min={0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Age</label>
          <input
            type="number"
            min={0}
            max={100}
            value={person.currentAge}
            onChange={(e) => onUpdatePerson(person.id, 'currentAge', e.target.valueAsNumber)}
            className={`w-full px-2.5 py-1.5 text-sm border rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 ${
              validateAge(person.currentAge)
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500/20'
            }`}
          />
          {validateAge(person.currentAge) && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{validateAge(person.currentAge)}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Retirement Age</label>
          <input
            type="number"
            min={person.currentAge + 1}
            max={100}
            value={person.retirementAge}
            onChange={(e) => onUpdatePerson(person.id, 'retirementAge', e.target.valueAsNumber)}
            className={`w-full px-2.5 py-1.5 text-sm border rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 ${
              validateRetirementAge(person.retirementAge, person.currentAge)
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20'
            }`}
          />
          {validateRetirementAge(person.retirementAge, person.currentAge) && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{validateRetirementAge(person.retirementAge, person.currentAge)}</p>
          )}
        </div>
      </div>

      {person.retirementAge <= person.currentAge && !validateRetirementAge(person.retirementAge, person.currentAge) && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded border border-amber-200 dark:border-amber-800">
          Retirement age must be greater than current age
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Accounts</span>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(person.id)}
              data-add-menu-trigger
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              + Add
            </button>
            {showAddMenu === person.id && (
              <div data-add-menu className="absolute z-50 right-0 mt-1 w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                <button
                  onClick={() => { onAddAccount(person.id, 'RRSP'); setShowAddMenu(null) }}
                  className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-t-lg"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></span>RRSP
                </button>
                <button
                  onClick={() => { onAddAccount(person.id, 'TFSA'); setShowAddMenu(null) }}
                  className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-b-lg"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>TFSA
                </button>
              </div>
            )}
          </div>
        </div>

        {person.accounts.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">No accounts</p>
        ) : (
          <div className="space-y-2">
            {person.accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onDelete={() => onDeleteAccount(person.id, account.id)}
                onUpdateBalance={(balance: number) => onUpdateAccountBalance(person.id, account.id, balance)}
                onUpdateContribution={(contribution: number) => onUpdateAccountContribution(person.id, account.id, contribution)}
              />
            ))}
          </div>
        )}
      </div>

      {canDeletePerson && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => onDeletePerson(person.id)}
            className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            - delete person
          </button>
        </div>
      )}
    </div>
  )
}
