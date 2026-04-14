import { AssumptionsPanel } from './AssumptionsPanel'
import { PersonSelector } from './PersonSelector'
import { PersonForm } from './PersonForm'
import { usePeople } from '@/contexts/PeopleContext'
import { useAssumptions } from '@/contexts/AssumptionsContext'

export function PlanTab() {
  const peopleApi = usePeople()
  const assumptions = useAssumptions()

  if (peopleApi.people.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-3">No people added yet</p>
        <button
          onClick={peopleApi.addPerson}
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
              people={peopleApi.people}
              selectedPersonId={peopleApi.selectedPersonId}
              onSelect={peopleApi.setSelectedPersonId}
            />
            <button
              onClick={peopleApi.addPerson}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              + Add Person
            </button>
          </div>
          <PersonForm
            people={peopleApi.people}
            selectedPersonId={peopleApi.selectedPersonId}
            onSelect={peopleApi.setSelectedPersonId}
            onUpdatePerson={peopleApi.updatePerson}
            onUpdatePersonAnnualIncome={peopleApi.updatePersonAnnualIncome}
            onUpdatePersonAnnualPension={peopleApi.updatePersonAnnualPension}
            onDeletePerson={peopleApi.deletePerson}
            onAddAccount={peopleApi.addAccount}
            onDeleteAccount={peopleApi.deleteAccount}
            onUpdateAccountBalance={peopleApi.updateAccountBalance}
            onUpdateAccountContribution={peopleApi.updateAccountContribution}
          />
      </div>

      <AssumptionsPanel
        expectedReturn={assumptions.expectedReturn}
        setExpectedReturn={assumptions.setExpectedReturn}
        inflationRate={assumptions.inflationRate}
        setInflationRate={assumptions.setInflationRate}
        replacementRate={assumptions.replacementRate}
        setReplacementRate={assumptions.setReplacementRate}
        withdrawalRate={assumptions.withdrawalRate}
        setWithdrawalRate={assumptions.setWithdrawalRate}
      />
    </div>
  )
}
