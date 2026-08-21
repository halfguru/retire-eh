import { FileText, Target, TrendingUp, Wallet, BookOpen } from 'lucide-react'

interface TabsProps {
  activeTab: string
  onChange: (tab: string) => void
}

const tabs = [
  { id: 'plan', label: 'Plan', icon: FileText, color: 'text-primary' },
  { id: 'overview', label: 'Overview', icon: Target, color: 'text-secondary' },
  { id: 'projections', label: 'Projections', icon: TrendingUp, color: 'text-indigo-500' },
  { id: 'learn', label: 'Learn', icon: BookOpen, color: 'text-violet-500' },
]

export function Tabs({ activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md sticky top-0 z-20 px-4">
      <nav className="-mb-px flex overflow-x-auto scrollbar-hide max-w-7xl mx-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : 'text-gray-400 dark:text-gray-500'}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
