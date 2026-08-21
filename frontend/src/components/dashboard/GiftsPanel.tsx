import { useAssumptions } from '@/contexts/AssumptionsContext'
import { Gift } from 'lucide-react'

interface GiftsPanelProps {
  defaultAge: number
}

export function GiftsPanel({ defaultAge }: GiftsPanelProps) {
  const { plannedGifts, addGift, updateGift, removeGift } = useAssumptions()

  return (
    <div className="animate-fade-in-up card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-500" />
          Planned Gifts
        </div>
        <button
          onClick={() => addGift(defaultAge)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          + Add Gift
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        One-time amounts you plan to give (e.g., kids' down payments). They're reserved from your
        retirement portfolio, so the plan checks you still have enough left for your income.
      </p>

      {plannedGifts.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-gray-500 italic">
          No planned gifts. Add one to see how it affects your retirement readiness.
        </div>
      ) : (
        <div className="space-y-3">
          {plannedGifts.map((gift) => (
            <div key={gift.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  type="text"
                  value={gift.label}
                  onChange={(e) => updateGift(gift.id, { label: e.target.value })}
                  placeholder="e.g., Kid 1 down payment"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="col-span-4 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={gift.amount}
                  onChange={(e) => updateGift(gift.id, { amount: e.target.valueAsNumber || 0 })}
                  className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="col-span-2 relative">
                <input
                  type="number"
                  min={0}
                  max={120}
                  step={1}
                  value={gift.age}
                  onChange={(e) => updateGift(gift.id, { age: Math.round(e.target.valueAsNumber || 0) })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="col-span-1 text-right">
                <button
                  onClick={() => removeGift(gift.id)}
                  aria-label={`Remove ${gift.label}`}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div className="text-[11px] text-gray-400 dark:text-gray-500 pt-1">
            Amount is in today's dollars; "age" is when you plan to give it.
          </div>
        </div>
      )}
    </div>
  )
}
