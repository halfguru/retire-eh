import type { Person, Account } from '@/hooks/usePeopleManagement'

interface PortfolioCardProps {
  portfolioView: 'combined' | 'individual'
  totalPortfolio: number
  selectedPersonPortfolio: number
  allAccounts: Account[]
  selectedPersonAccounts: Account[]
  selectedPortfolioPerson: Person | undefined
}

export function PortfolioCard({
  portfolioView,
  totalPortfolio,
  selectedPersonPortfolio,
  allAccounts,
  selectedPersonAccounts,
  selectedPortfolioPerson
}: PortfolioCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-6" style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        💰 Current Portfolio
      </h2>
      <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
        ${portfolioView === 'combined' ? totalPortfolio.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : selectedPersonPortfolio.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </div>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {portfolioView === 'combined'
          ? `${allAccounts.length} ${allAccounts.length === 1 ? 'account' : 'accounts'}`
          : `${selectedPersonAccounts.length} ${selectedPersonAccounts.length === 1 ? 'account' : 'accounts'} (${selectedPortfolioPerson?.name})`
        }
      </div>
    </div>
  )
}
