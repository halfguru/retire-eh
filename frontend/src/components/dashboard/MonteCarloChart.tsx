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
  Legend,
} from 'recharts'
import { runMonteCarlo } from '@/lib/projectionSim'
import { formatCompactMoney, formatMoney } from '@/lib/formatting'
import { Activity } from 'lucide-react'

interface MonteCarloChartProps {
  isDarkMode: boolean
  initialBalance: number
  annualContribution: number
  yearsToRetirement: number
  expectedReturn: number
  inflationRate: number
  startAge: number
  showRealValues: boolean
}

export function MonteCarloChart({
  isDarkMode,
  initialBalance,
  annualContribution,
  yearsToRetirement,
  expectedReturn,
  inflationRate,
  startAge,
  showRealValues,
}: MonteCarloChartProps) {
  const data = useMemo(() => {
    if (yearsToRetirement <= 0) return []
    const months = yearsToRetirement * 12
    const raw = runMonteCarlo({
      initialBalance,
      monthlyContribution: annualContribution / 12,
      months,
      expectedReturnPct: expectedReturn,
      inflationPct: inflationRate,
      startAge,
      showRealValues,
    })
    return raw.map((d) => ({
      age: d.age,
      p10: d.p10,
      outerBand: d.p90 - d.p10,
      p25: d.p25,
      innerBand: d.p75 - d.p25,
      p50: d.p50,
    }))
  }, [initialBalance, annualContribution, yearsToRetirement, expectedReturn, inflationRate, startAge, showRealValues])

  if (yearsToRetirement <= 0 || data.length === 0) return null

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
        <Activity className="w-5 h-5 text-indigo-500" />
        Projection Range (Monte Carlo)
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        500 simulations with market volatility. Bands show the 10–90% and 25–75% outcome ranges in {showRealValues ? "today's" : 'future (nominal)'} dollars.
      </p>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area dataKey="p10" stackId="o" stroke="none" fill="transparent" name="10–90% range" />
            <Area dataKey="outerBand" stackId="o" stroke="none" fill="#6366f1" fillOpacity={0.18} name="10–90% range" />
            <Area dataKey="p25" stackId="i" stroke="none" fill="transparent" name="25–75% range" />
            <Area dataKey="innerBand" stackId="i" stroke="none" fill="#6366f1" fillOpacity={0.15} name="25–75% range" />
            <Line dataKey="p50" stroke="#4338ca" strokeWidth={2} dot={false} name="Median" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
