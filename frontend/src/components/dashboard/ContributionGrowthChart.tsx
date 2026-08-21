import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { buildContributionGrowth } from '@/lib/projectionSim'
import { formatCompactMoney, formatMoney } from '@/lib/formatting'
import { PiggyBank } from 'lucide-react'

interface ContributionGrowthChartProps {
  isDarkMode: boolean
  projectionData: { age: number; Total: number }[]
  annualContribution: number
}

export function ContributionGrowthChart({
  isDarkMode,
  projectionData,
  annualContribution,
}: ContributionGrowthChartProps) {
  const data = useMemo(
    () => buildContributionGrowth({ projectionData, annualContribution }),
    [projectionData, annualContribution]
  )

  if (data.length === 0) return null

  const axisColor = isDarkMode ? '#9ca3af' : '#6b7280'
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb'
  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    border: `1px solid ${gridColor}`,
    borderRadius: '8px',
  }

  return (
    <div className="animate-fade-in-up-delay-3 card p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
        <PiggyBank className="w-5 h-5 text-secondary" />
        Contributions vs Investment Growth
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        How your final portfolio splits between money you contributed and market growth.
      </p>
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-gray-700 dark:text-gray-300">Contributions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
          <span className="text-gray-700 dark:text-gray-300">Growth</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-gray-700 dark:text-gray-300">Total</span>
        </div>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} strokeOpacity={0.25} />
            <XAxis
              dataKey="age"
              stroke={axisColor}
              tick={{ fontSize: 12, fill: axisColor }}
              label={{ value: 'Age', position: 'insideBottom', offset: -8, fontSize: 13, fontWeight: 500, fill: axisColor }}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fontSize: 12, fill: axisColor }}
              tickFormatter={(value) => formatCompactMoney(value)}
              padding={{ top: 10, bottom: 20 }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined, name?: string) => [`${formatMoney(value ?? 0)}`, name ?? ''] as const}
              labelFormatter={(label) => `Age ${label}`}
              labelStyle={{ color: isDarkMode ? '#f3f4f6' : '#374151', fontWeight: 500 }}
            />
            <Area dataKey="contributions" stackId="a" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Contributions" />
            <Area dataKey="growth" stackId="a" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="Growth" />
            <Line dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={false} name="Total" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
