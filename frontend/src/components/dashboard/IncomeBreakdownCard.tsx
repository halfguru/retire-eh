import { formatMoney, formatCompactMoney } from '@/lib/formatting'
import { getPortfolioAfterGifts, type PlannedGiftLite } from '@/lib/calculations'
import { ModeBadge } from '@/components/ui/ModeBadge'
import { Wallet } from 'lucide-react'

interface IncomeBreakdownCardProps {
  portfolioAtRetirement: number
  annualPension: number
  annualCpp: number
  annualOas: number
  withdrawalRate: number
  retirementAge: number
  showRealValues: boolean
  inflationRate: number
  yearsToRetirement: number
  plannedGifts: PlannedGiftLite[]
}

const DONUT_R = 52
const DONUT_C = 2 * Math.PI * DONUT_R

export function IncomeBreakdownCard({
  portfolioAtRetirement,
  annualPension,
  annualCpp,
  annualOas,
  withdrawalRate,
  retirementAge,
  showRealValues,
  inflationRate,
  yearsToRetirement,
  plannedGifts
}: IncomeBreakdownCardProps) {
  // In nominal ("future dollars") mode, inflate the guaranteed (inflation-protected)
  // income sources to retirement-age dollars so the total is comparable to the nominal portfolio.
  const inflationFactor = showRealValues
    ? 1
    : Math.pow(1 + inflationRate / 100, Math.max(0, yearsToRetirement))

  // Gifts are reserved from the portfolio, so the sustainable withdrawal is based on the remainder.
  const portfolioAfterGifts = getPortfolioAfterGifts(portfolioAtRetirement, plannedGifts, yearsToRetirement, showRealValues, inflationRate)
  const giftTotal = portfolioAtRetirement - portfolioAfterGifts
  const portfolioWithdrawal = portfolioAfterGifts * (withdrawalRate / 100)
  const oasEstimate = annualOas * inflationFactor
  const cppEstimate = annualCpp * inflationFactor
  const pensionEstimate = annualPension * inflationFactor

  const totalAnnualIncome = portfolioWithdrawal + pensionEstimate + oasEstimate + cppEstimate
  const totalMonthlyIncome = totalAnnualIncome / 12

  const incomeSources = [
    {
      name: 'Portfolio Withdrawal',
      amount: portfolioWithdrawal,
      description: `${withdrawalRate}% of projected portfolio`,
      color: '#6366f1'
    },
    {
      name: 'Annual CPP (estimated)',
      amount: cppEstimate,
      description: 'Your entered annual CPP estimate at retirement (defaults to 2026 maximum)',
      color: '#10b981'
    },
    {
      name: 'OAS (estimated)',
      amount: oasEstimate,
      description: retirementAge >= 65 ? 'Max OAS at 65+' : 'Available at 65',
      color: '#f59e0b'
    },
    {
      name: 'Employer Pension',
      amount: pensionEstimate,
      description: 'Your pension income',
      color: '#a855f7'
    }
  ].filter(source => source.amount > 0 || source.name === 'Portfolio Withdrawal')

  const segments = incomeSources
    .map((source, i, arr) => {
      const start = arr.slice(0, i).reduce((s, x) => s + x.amount, 0)
      return { ...source, start }
    })
    .filter(source => source.amount > 0)

  const totalForDonut = segments.reduce((s, x) => s + x.amount, 0)

  return (
    <div className="animate-fade-in-up card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-500" />
          Retirement Income Breakdown
          <ModeBadge showRealValues={showRealValues} />
        </h2>

      <div className="flex items-center justify-start">
        <div className="relative w-full max-w-[360px] h-40">
          <svg viewBox="0 0 320 120" className="w-full h-full">
            <circle cx="60" cy="60" r={DONUT_R} fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700 donut-segment" strokeWidth="14" transform="rotate(-90 60 60)" />
            {segments.map((segment) => (
              <circle
                key={segment.name}
                cx="60"
                cy="60"
                r={DONUT_R}
                fill="none"
                stroke={segment.color}
                strokeWidth="14"
                strokeDasharray={`${(segment.amount / totalForDonut) * DONUT_C} ${DONUT_C}`}
                strokeDashoffset={-(segment.start / totalForDonut) * DONUT_C}
                strokeLinecap="round"
                className="donut-segment"
                transform="rotate(-90 60 60)"
              >
                <title>{segment.name}: ${formatMoney(segment.amount)} ({Math.round((segment.amount / totalForDonut) * 100)}%)</title>
              </circle>
            ))}

            {/* Center Text */}
            <text x="60" y="58" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500 text-[10px] uppercase font-semibold tracking-wider">Annual</text>
            <text x="60" y="76" textAnchor="middle" className="fill-gray-800 dark:fill-gray-100 text-[15px] font-bold">${formatCompactMoney(totalAnnualIncome)}</text>

            {/* Legends */}
            {segments.map((source, i) => {
              const startY = 60 - (segments.length * 24) / 2 + 10
              return (
                <g key={source.name}>
                  <circle cx="136" cy={startY + i * 24} r="4.5" fill={source.color} />
                  <text x="146" y={startY + i * 24 + 4} className="fill-gray-800 dark:fill-gray-100 text-[11px] font-semibold">
                    {source.name} ({Math.round((source.amount / totalForDonut) * 100)}%)
                  </text>
                  <text x="146" y={startY + i * 24 + 15} className="fill-gray-500 dark:fill-gray-400 text-[9.5px] font-medium">
                    ${formatMoney(source.amount)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {giftTotal > 0 && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
          <div className="flex justify-between items-center">
            <span>Planned gifts reserved (e.g., kids' down payments)</span>
            <span className="font-semibold">${formatMoney(giftTotal)}</span>
          </div>
          <div className="text-xs mt-1">
            Set aside from the portfolio at retirement; your withdrawal above is based on what remains.
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Annual Income</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ${formatMoney(totalAnnualIncome)}
            </div>
          </div>
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Income</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${formatMoney(totalMonthlyIncome)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        * CPP and OAS are estimates. Actual amounts depend on contribution history and residency.
      </div>
    </div>
  )
}
