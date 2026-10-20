import type { Person } from '@/types/household'

interface PersonSelectorProps {
  people: Person[]
  selectedPersonId: string | null
  onSelect: (id: string) => void
}

export function PersonSelector({ people, selectedPersonId, onSelect }: PersonSelectorProps) {
  if (people.length <= 1) {
    return (
      <div className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
        {people[0]?.name || 'Person'}
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {people.map((person) => (
        <button
          key={person.id}
          onClick={() => onSelect(person.id)}
          className={`px-3 py-1 rounded text-sm font-medium transition-all whitespace-nowrap ${
            selectedPersonId === person.id
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {person.name}
        </button>
      ))}
    </div>
  )
}
