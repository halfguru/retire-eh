import { InfoTooltip } from './InfoTooltip'

interface AssumptionsPanelProps {
  expectedReturn: number
  setExpectedReturn: (value: number) => void
  inflationRate: number
  setInflationRate: (value: number) => void
  replacementRate: number
  setReplacementRate: (value: number) => void
  withdrawalRate: number
  setWithdrawalRate: (value: number) => void
}

export function AssumptionsPanel({
  expectedReturn,
  setExpectedReturn,
  inflationRate,
  setInflationRate,
  replacementRate,
  setReplacementRate,
  withdrawalRate,
  setWithdrawalRate
}: AssumptionsPanelProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3" style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Assumptions</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Investment Return <InfoTooltip text="Expected annual return on investments" />
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.valueAsNumber)}
              className="w-full px-2 py-1 pr-6 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Inflation Rate <InfoTooltip text="Expected annual inflation" />
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.valueAsNumber)}
              className="w-full px-2 py-1 pr-6 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Income Target <InfoTooltip text="% of pre-retirement income needed in retirement" />
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={150}
              step={5}
              value={replacementRate}
              onChange={(e) => setReplacementRate(e.target.valueAsNumber)}
              className="w-full px-2 py-1 pr-6 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Withdrawal Rate <InfoTooltip text="Safe annual withdrawal % (4% rule)" />
          </label>
          <div className="relative">
            <input
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              value={withdrawalRate}
              onChange={(e) => setWithdrawalRate(e.target.valueAsNumber)}
              className="w-full px-2 py-1 pr-6 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
