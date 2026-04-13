import { AssumptionsPanel } from './AssumptionsPanel'
import { PersonSelector } from './PersonSelector'
import { PersonForm } from './PersonForm'
import type { Person } from '@/hooks/usePeopleManagement'

interface PlanTabProps {
  people: Person[]
  selectedPersonId: string | null
  onSelectPerson: (id: string) => void
  onUpdatePerson: (id: string, field: keyof Person, value: string | number) => void
  onUpdatePersonAnnualIncome: (personId: string, annualIncome: number) => void
  onUpdatePersonAnnualPension: (personId: string, annualPension: number) => void
  onDeletePerson: (id: string) => void
  onAddPerson: () => void
  onAddAccount: (personId: string, type: 'RRSP' | 'TFSA') => void
  onDeleteAccount: (personId: string, accountId: string) => void
  onUpdateAccountBalance: (personId: string, accountId: string, balance: number) => void
  onUpdateAccountContribution: (personId: string, accountId: string, contribution: number) => void
  expectedReturn: number
  setExpectedReturn: (value: number) => void
  inflationRate: number
  setInflationRate: (value: number) => void
  replacementRate: number
  setReplacementRate: (value: number) => void
  withdrawalRate: number
  setWithdrawalRate: (value: number) => void
}

export function PlanTab({
  people,
  selectedPersonId,
  onSelectPerson,
  onUpdatePerson,
  onUpdatePersonAnnualIncome,
  onUpdatePersonAnnualPension,
  onDeletePerson,
  onAddPerson,
  onAddAccount,
  onDeleteAccount,
  onUpdateAccountBalance,
  onUpdateAccountContribution,
  expectedReturn,
  setExpectedReturn,
  inflationRate,
  setInflationRate,
  replacementRate,
  setReplacementRate,
  withdrawalRate,
  setWithdrawalRate
}: PlanTabProps) {
  if (people.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-3">No people added yet</p>
        <button
          onClick={onAddPerson}
          className="px-4 py-2 text-sm font-medium rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
        >
          Add Person
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <PersonSelector
              people={people}
              selectedPersonId={selectedPersonId}
              onSelect={onSelectPerson}
            />
            <button
              onClick={onAddPerson}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              + Add Person
            </button>
          </div>
          <PersonForm
            people={people}
            selectedPersonId={selectedPersonId}
            onSelect={onSelectPerson}
            onUpdatePerson={onUpdatePerson}
            onUpdatePersonAnnualIncome={onUpdatePersonAnnualIncome}
            onUpdatePersonAnnualPension={onUpdatePersonAnnualPension}
            onDeletePerson={onDeletePerson}
            onAddAccount={onAddAccount}
            onDeleteAccount={onDeleteAccount}
            onUpdateAccountBalance={onUpdateAccountBalance}
            onUpdateAccountContribution={onUpdateAccountContribution}
          />
      </div>

      <AssumptionsPanel
        expectedReturn={expectedReturn}
        setExpectedReturn={setExpectedReturn}
        inflationRate={inflationRate}
        setInflationRate={setInflationRate}
        replacementRate={replacementRate}
        setReplacementRate={setReplacementRate}
        withdrawalRate={withdrawalRate}
        setWithdrawalRate={setWithdrawalRate}
      />
    </div>
  )
}
