import { formatMoney } from '@/lib/formatting'

interface IncomeBreakdownCardProps {
  portfolioAtRetirement: number
  annualPension: number
  withdrawalRate: number
  retirementAge: number
}

const OAS_MAX_2024 = 8296
const CPP_AVERAGE_2024 = 9600

export function IncomeBreakdownCard({
  portfolioAtRetirement,
  annualPension,
  withdrawalRate,
  retirementAge
}: IncomeBreakdownCardProps) {
  const portfolioWithdrawal = portfolioAtRetirement * (withdrawalRate / 100)
  const oasEstimate = retirementAge >= 65 ? OAS_MAX_2024 : 0
  const cppEstimate = CPP_AVERAGE_2024

  const totalAnnualIncome = portfolioWithdrawal + annualPension + oasEstimate + cppEstimate
  const totalMonthlyIncome = totalAnnualIncome / 12

  const incomeSources = [
    {
      name: 'Portfolio Withdrawal',
      amount: portfolioWithdrawal,
      description: `${withdrawalRate}% of projected portfolio`,
      color: 'indigo'
    },
    {
      name: 'CPP (estimated)',
      amount: cppEstimate,
      description: 'Average CPP benefit',
      color: 'emerald'
    },
    {
      name: 'OAS (estimated)',
      amount: oasEstimate,
      description: retirementAge >= 65 ? 'Max OAS at 65+' : 'Available at 65',
      color: 'amber'
    },
    {
      name: 'Employer Pension',
      amount: annualPension,
      description: 'Your pension income',
      color: 'purple'
    }
  ].filter(source => source.amount > 0 || source.name === 'Portfolio Withdrawal')

  return (
    <div className="animate-fade-in-up bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6">
        💰 Retirement Income Breakdown
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {incomeSources.map((source) => (
          <div
            key={source.name}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {source.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {source.description}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900 dark:text-white">
                ${formatMoney(source.amount)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                /year
              </div>
            </div>
          </div>
        ))}
      </div>

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
