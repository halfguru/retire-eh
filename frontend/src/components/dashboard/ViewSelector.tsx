import type { Person } from '@/hooks/usePeopleManagement'

interface ViewSelectorProps {
  selectedPortfolioPersonId: string | null
  people: Person[]
  onPersonChange: (personId: string | null) => void
}

export function ViewSelector({
  selectedPortfolioPersonId,
  people,
  onPersonChange
}: ViewSelectorProps) {
  if (people.length <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="view-select" className="text-sm text-gray-600 dark:text-gray-400">
        View:
      </label>
      <select
        id="view-select"
        value={selectedPortfolioPersonId || 'household'}
        onChange={(e) => onPersonChange(e.target.value === 'household' ? null : e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="household">Household</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
    </div>
  )
}
