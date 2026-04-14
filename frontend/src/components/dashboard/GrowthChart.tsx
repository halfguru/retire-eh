import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ProjectionDataPoint } from '@/types/household'
import type { Person } from '@/types/household'
import { formatCompactMoney, formatMoney } from '@/lib/formatting'

interface GrowthChartProps {
  isDarkMode: boolean
  portfolioView: 'combined' | 'individual'
  selectedPortfolioPerson: Person | undefined
  currentProjectionData: ProjectionDataPoint[]
  yearsToRetirement: number
}

export function GrowthChart({ isDarkMode, portfolioView, selectedPortfolioPerson, currentProjectionData, yearsToRetirement }: GrowthChartProps) {
  if (yearsToRetirement <= 0 || currentProjectionData.length === 0) return null

  return (
    <div className="animate-fade-in-up-delay-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        📈 Growth Projection {portfolioView === 'individual' && selectedPortfolioPerson && `(${selectedPortfolioPerson.name})`}
      </h2>
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
          <span className="text-gray-700 dark:text-gray-300">RRSP</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-gray-700 dark:text-gray-300">TFSA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-gray-700 dark:text-gray-300">Total</span>
        </div>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentProjectionData} margin={{ top: 30, right: 50, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={isDarkMode ? '#374151' : '#e5e7eb'} strokeOpacity={0.5} />
            <XAxis
              dataKey="age"
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fontSize: 12, fill: isDarkMode ? '#d1d5db' : '#6b7280' }}
              label={{ value: 'Age', position: 'insideBottom', offset: -8, fontSize: 13, fontWeight: 500, fill: isDarkMode ? '#f3f4f6' : '#6b7280' }}
            />
            <YAxis
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fontSize: 12, fill: isDarkMode ? '#d1d5db' : '#6b7280' }}
              tickFormatter={(value) => formatCompactMoney(value)}
              padding={{ top: 10, bottom: 20 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              formatter={(value: number | undefined, name?: string) => [`$${formatMoney(value ?? 0)}`, name || '']}
              labelFormatter={(label) => `Age ${label}`}
              labelStyle={{ color: isDarkMode ? '#f3f4f6' : '#374151', fontWeight: 500 }}
            />
            <Line
              type="monotone"
              dataKey="RRSP"
              stroke="#6366f1"
              strokeWidth={3}
              dot={true}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="TFSA"
              stroke="#10b981"
              strokeWidth={3}
              dot={true}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="Total"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={true}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
