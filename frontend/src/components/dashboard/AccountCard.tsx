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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between w-full sm:w-auto">
        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${typeColor}`}>
          {account.type}
        </span>
        <button onClick={onDelete} className="p-1 sm:hidden text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 gap-2 w-full">
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full">
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-14 sm:w-auto">Balance</span>
          <div className="flex-1 w-full">
            <NumberInput value={account.balance || 0} onChange={onUpdateBalance} step={1000} min={0} />
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full">
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-14 sm:w-auto">Annual</span>
          <div className="flex-1 w-full">
            <NumberInput value={account.annualContribution || 0} onChange={onUpdateContribution} step={100} min={0} />
          </div>
        </div>
      </div>

      <button onClick={onDelete} className="hidden sm:block p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
