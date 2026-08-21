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
  retirementTaxRate: number
  setRetirementTaxRate: (value: number) => void
}

interface AssumptionFieldProps {
  label: string
  tooltip: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function AssumptionField({ label, tooltip, value, min, max, step, onChange }: AssumptionFieldProps) {
  const handle = (v: number) => {
    if (!Number.isNaN(v)) onChange(v)
  }
  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
        {label} <InfoTooltip text={tooltip} />
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handle(e.target.valueAsNumber)}
          className="flex-1 accent-indigo-500 cursor-pointer"
        />
        <div className="relative w-20">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handle(e.target.valueAsNumber)}
            className="w-full px-2 py-1.5 pr-6 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
        </div>
      </div>
    </div>
  )
}

export function AssumptionsPanel({
  expectedReturn,
  setExpectedReturn,
  inflationRate,
  setInflationRate,
  replacementRate,
  setReplacementRate,
  withdrawalRate,
  setWithdrawalRate,
  retirementTaxRate,
  setRetirementTaxRate
}: AssumptionsPanelProps) {
  return (
    <div className="animate-fade-in-up-delay-1 card p-4 h-fit">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Assumptions</div>
      <div className="grid grid-cols-1 gap-4">
        <AssumptionField
          label="Investment Return"
          tooltip="Expected annual return before inflation (nominal). With 'Show real values' on, results are shown in today's (inflation-adjusted) dollars."
          value={expectedReturn}
          min={0}
          max={15}
          step={0.5}
          onChange={setExpectedReturn}
        />
        <AssumptionField
          label="Inflation Rate"
          tooltip="Expected annual inflation"
          value={inflationRate}
          min={0}
          max={10}
          step={0.5}
          onChange={setInflationRate}
        />
        <AssumptionField
          label="Income Target"
          tooltip="% of pre-retirement income needed in retirement"
          value={replacementRate}
          min={0}
          max={100}
          step={5}
          onChange={setReplacementRate}
        />
        <AssumptionField
          label="Withdrawal Rate"
          tooltip="Safe annual withdrawal % (4% rule)"
          value={withdrawalRate}
          min={1}
          max={10}
          step={0.1}
          onChange={setWithdrawalRate}
        />
        <AssumptionField
          label="Retirement Tax Rate (RRSP)"
          tooltip="Estimated average tax rate on taxable withdrawals (RRSP/RRIF) during retirement."
          value={retirementTaxRate}
          min={0}
          max={50}
          step={1}
          onChange={setRetirementTaxRate}
        />
      </div>
    </div>
  )
}
