import { useState, useMemo } from 'react'
import type { Account } from '@/hooks/usePeopleManagement'
import { formatCurrency } from '@/hooks/usePeopleManagement'

function NumberInput({ value, onChange, min }: { value: number, onChange: (val: number) => void, step?: number, min?: number }) {
  const [focused, setFocused] = useState(false)

  const displayValue = useMemo(() => {
    return focused ? (value === 0 ? '' : String(value)) : (value === 0 ? '' : formatCurrency(value))
  }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '')
    const num = parseFloat(raw) || 0
    if (min === undefined || num >= min) onChange(num)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        data-lpignore="true"
        className="number-input w-full px-2 py-1 pr-6 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        style={{ caretColor: '#1f2937' }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
      <style>{`
        .number-input::-webkit-autofill, .number-input:-webkit-autofill {
          -webkit-text-fill-color: #111827;
          -webkit-box-shadow: 0 0 0 30px #fff inset;
        }
        @media (prefers-color-scheme: dark) {
          .number-input::-webkit-autofill, .number-input:-webkit-autofill {
            -webkit-text-fill-color: #f3f4f6;
            -webkit-box-shadow: 0 0 0 30px #374151 inset;
          }
        }
      `}</style>
    </div>
  )
}

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
