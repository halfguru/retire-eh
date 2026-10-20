import { Banknote } from 'lucide-react'

interface ModeBadgeProps {
  showRealValues: boolean
}

export function ModeBadge({ showRealValues }: ModeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        showRealValues
          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      }`}
      title={showRealValues ? "Values shown in today's purchasing power" : 'Values shown in future (nominal) dollars'}
    >
      <Banknote className="w-3 h-3" />
      {showRealValues ? "Today's $" : 'Future $'}
    </span>
  )
}
