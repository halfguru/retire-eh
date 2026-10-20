import { useAssumptions } from '@/contexts/AssumptionsContext'
import { Gift } from 'lucide-react'
import { NumberInput } from '@/components/ui/NumberInput'
import { IntegerInput } from '@/components/ui/IntegerInput'

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
          <div className="grid grid-cols-12 gap-2 px-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <div className="col-span-5">Description</div>
            <div className="col-span-4">Amount (today's $)</div>
            <div className="col-span-2">Age</div>
          </div>
          {plannedGifts.map((gift) => (
            <div key={gift.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  type="text"
                  value={gift.label}
                  onChange={(e) => updateGift(gift.id, { label: e.target.value })}
                  placeholder="e.g., Kid 1 down payment"
                  aria-label="Gift description"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="col-span-4">
                <NumberInput
                  value={gift.amount}
                  onChange={(val) => updateGift(gift.id, { amount: val })}
                  step={1000}
                  min={0}
                  size="compact"
                  ariaLabel={`Amount for ${gift.label || 'gift'}`}
                />
              </div>
              <div className="col-span-2">
                <IntegerInput
                  value={gift.age}
                  onChange={(val) => updateGift(gift.id, { age: val })}
                  min={0}
                  max={120}
                  ariaLabel={`Age when giving ${gift.label || 'gift'}`}
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
            Amounts are in today's dollars. Age is on the plan's projection timeline, not tied to a specific person.
          </div>
        </div>
      )}
    </div>
  )
}
