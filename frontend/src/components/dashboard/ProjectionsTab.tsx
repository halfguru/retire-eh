import { GrowthChart } from './GrowthChart'
import type { Person } from '@/hooks/usePeopleManagement'
import type { ProjectionDataPoint } from '@/hooks/useProjection'

interface ProjectionsTabProps {
  isDarkMode: boolean
  portfolioView: 'combined' | 'individual'
  selectedPortfolioPerson: Person | undefined
  currentProjectionData: ProjectionDataPoint[]
  yearsToRetirement: number
}

export function ProjectionsTab({
  isDarkMode,
  portfolioView,
  selectedPortfolioPerson,
  currentProjectionData,
  yearsToRetirement
}: ProjectionsTabProps) {
  return (
    <div className="space-y-6">
      <GrowthChart
        isDarkMode={isDarkMode}
        portfolioView={portfolioView}
        selectedPortfolioPerson={selectedPortfolioPerson}
        currentProjectionData={currentProjectionData}
        yearsToRetirement={yearsToRetirement}
      />

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          📊 Understanding Your Projection
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong className="text-gray-800 dark:text-gray-200">Growth Rate:</strong> Your portfolio is projected to grow at {7}% annually (before inflation adjustment).
          </p>
          <p>
            <strong className="text-gray-800 dark:text-gray-200">Inflation:</strong> Values are adjusted for {2.5}% annual inflation to show purchasing power in today's dollars.
          </p>
          <p>
            <strong className="text-gray-800 dark:text-gray-200">Contributions:</strong> Regular contributions accelerate growth through dollar-cost averaging.
          </p>
        </div>
      </div>
    </div>
  )
}
