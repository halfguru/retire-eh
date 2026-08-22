import { lazy, Suspense, useState } from 'react'
import { useProjectionContext } from '@/contexts/ProjectionContext'
import { useAssumptions } from '@/contexts/AssumptionsContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import { getPortfolioAtRetirement } from '@/lib/calculations'
import { BarChart3 } from 'lucide-react'

const GrowthChart = lazy(() => import('./GrowthChart').then(m => ({ default: m.GrowthChart })))
const MonteCarloChart = lazy(() => import('./MonteCarloChart').then(m => ({ default: m.MonteCarloChart })))
const ContributionGrowthChart = lazy(() => import('./ContributionGrowthChart').then(m => ({ default: m.ContributionGrowthChart })))
const DrawdownChart = lazy(() => import('./DrawdownChart').then(m => ({ default: m.DrawdownChart })))

function ChartFallback() {
  return (
    <div className="h-96 flex items-center justify-center card">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}

export function ProjectionsTab() {
  const [isDarkMode] = useDarkMode()
  const projection = useProjectionContext()
  const assumptions = useAssumptions()
  const [accumulationView, setAccumulationView] = useState<'growth' | 'contributions' | 'volatility'>('growth')

  const projectionData = projection.currentProjectionData
  const startAge = projectionData.length > 0 ? projectionData[0].age : 0
  const retirementAge = projectionData.length > 0 ? projectionData[projectionData.length - 1].age : 0
  const startBalance = getPortfolioAtRetirement(projectionData)

  return (
    <div className="space-y-6">
      {/* 1. Accumulation Phase (Saving) Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-gray-700/50 pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">1. Saving Phase (Accumulation)</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Projecting your growth path up to retirement age</p>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start md:self-center">
            <button
              onClick={() => setAccumulationView('growth')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                accumulationView === 'growth'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-250'
              }`}
            >
              Standard Growth
            </button>
            <button
              onClick={() => setAccumulationView('contributions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                accumulationView === 'contributions'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-250'
              }`}
            >
              Contribution vs. Growth
            </button>
            <button
              onClick={() => setAccumulationView('volatility')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                accumulationView === 'volatility'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-250'
              }`}
            >
              Market Volatility (Monte Carlo)
            </button>
          </div>
        </div>

        <Suspense fallback={<ChartFallback />}>
          {accumulationView === 'growth' && (
            <GrowthChart
              isDarkMode={isDarkMode}
              currentProjectionData={projection.currentProjectionData}
              conservativeProjectionData={projection.conservativeProjectionData}
              optimisticProjectionData={projection.optimisticProjectionData}
              yearsToRetirement={projection.yearsToRetirement}
              expectedReturn={assumptions.expectedReturn}
            />
          )}
          {accumulationView === 'contributions' && (
            <ContributionGrowthChart
              isDarkMode={isDarkMode}
              projectionData={projectionData}
              annualContribution={projection.totalAnnualContributions}
              showRealValues={assumptions.showRealValues}
              inflationRate={assumptions.inflationRate}
            />
          )}
          {accumulationView === 'volatility' && (
            <MonteCarloChart
              isDarkMode={isDarkMode}
              initialBalance={projectionData.length > 0 ? projectionData[0].Total : 0}
              annualContribution={projection.totalAnnualContributions}
              yearsToRetirement={projection.yearsToRetirement}
              expectedReturn={assumptions.expectedReturn}
              inflationRate={assumptions.inflationRate}
              startAge={startAge}
              showRealValues={assumptions.showRealValues}
            />
          )}
        </Suspense>
      </div>

      {/* 2. Decumulation Phase (Spending) Section */}
      <div className="space-y-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">2. Spending Phase (Decumulation)</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Projecting how long your savings will last in retirement</p>
        </div>

        <Suspense fallback={<ChartFallback />}>
          <DrawdownChart
            isDarkMode={isDarkMode}
            startBalance={startBalance}
            expectedReturn={assumptions.expectedReturn}
            inflationRate={assumptions.inflationRate}
            withdrawalRate={assumptions.withdrawalRate}
            startAge={retirementAge}
            showRealValues={assumptions.showRealValues}
            plannedGifts={assumptions.plannedGifts}
            minCurrentAge={projection.minCurrentAge}
          />
        </Suspense>
      </div>

      {/* Educational Footer Info */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Understanding Your Projection
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong className="text-gray-800 dark:text-gray-200">Growth Rate:</strong> Your portfolio compounds at {assumptions.expectedReturn}% annually — a <strong className="text-gray-800 dark:text-gray-200">nominal</strong> (pre-inflation) return. After inflation, that's about {(((1 + assumptions.expectedReturn / 100) / (1 + assumptions.inflationRate / 100) - 1) * 100).toFixed(1)}% in real terms.
          </p>
          <p>
            <strong className="text-gray-800 dark:text-gray-200">Inflation &amp; Real Values:</strong> The {assumptions.inflationRate}% rate is applied separately. "Show real values" converts balances into today's dollars (real purchasing power), keeping nominal growth and real value distinct.
          </p>
          <p>
            <strong className="text-gray-800 dark:text-gray-200">Contributions:</strong> Regular contributions accelerate growth through dollar-cost averaging.
          </p>
          <p>
            <strong className="text-gray-800 dark:text-gray-200">Monte Carlo:</strong> Uses ~13% annual market volatility to show a range of plausible outcomes, not a single guaranteed path.
          </p>
        </div>
      </div>
    </div>
  )
}
