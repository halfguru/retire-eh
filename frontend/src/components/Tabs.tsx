interface TabsProps {
  activeTab: string
  onChange: (tab: string) => void
}

const tabs = [
  { id: 'plan', label: 'Plan', icon: '📝' },
  { id: 'overview', label: 'Overview', icon: '🎯' },
  { id: 'projections', label: 'Projections', icon: '📈' },
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'learn', label: 'Learn', icon: '📚' },
]

export function Tabs({ activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-20 px-4">
      <nav className="-mb-px flex overflow-x-auto scrollbar-hide max-w-7xl mx-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
