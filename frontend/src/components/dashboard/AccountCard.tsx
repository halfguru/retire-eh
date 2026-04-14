import type { Account } from '@/types/household'
import { NumberInput } from '@/components/ui/NumberInput'

interface AccountCardProps {
  account: Account
  onDelete: () => void
  onUpdateBalance: (balance: number) => void
  onUpdateContribution: (contribution: number) => void
}

export function AccountCard({ account, onDelete, onUpdateBalance, onUpdateContribution }: AccountCardProps) {
  const typeColor = account.type === 'RRSP' 
    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' 
    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${typeColor}`}>
        {account.type}
      </span>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Balance</span>
          <NumberInput value={account.balance || 0} onChange={onUpdateBalance} step={1000} min={0} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Annual</span>
          <NumberInput value={account.annualContribution || 0} onChange={onUpdateContribution} step={100} min={0} />
        </div>
      </div>
      <button onClick={onDelete} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
