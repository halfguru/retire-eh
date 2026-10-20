import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingDown } from 'lucide-react'
import { formatCompactMoney, formatMoney } from '@/lib/formatting'
import { type PlannedGiftLite } from '@/lib/calculations'

interface DrawdownChartProps {
  isDarkMode: boolean
  startBalance: number
  expectedReturn: number
  inflationRate: number
  withdrawalRate: number
  startAge: number
  endAge?: number
  showRealValues: boolean
  plannedGifts: PlannedGiftLite[]
  minCurrentAge: number
}

const RATES = [4, 4.5, 5, 5.5, 6]
const RATE_COLORS = ['#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#dc2626']

export function DrawdownChart({
  isDarkMode,
  startBalance,
  expectedReturn,
  inflationRate,
  withdrawalRate,
  startAge,
  endAge = 95,
  showRealValues,
  plannedGifts,
  minCurrentAge,
}: DrawdownChartProps) {
  const realReturn = (1 + expectedReturn / 100) / (1 + inflationRate / 100) - 1
  // When showing real (today's) dollars, simulate in real terms; otherwise in nominal terms.
  const annualGrowth = showRealValues ? realReturn : expectedReturn / 100
  const years = endAge - startAge

  // One-time gifts are mapped to the age they're given, inflated to the chart's dollar basis.
  const { giftAtAge, totalGifts } = useMemo(() => {
    const map: Record<number, number> = {}
    for (const g of plannedGifts) {
      const inflated = showRealValues
        ? g.amount
        : g.amount * Math.pow(1 + inflationRate / 100, Math.max(0, g.age - minCurrentAge))
      map[g.age] = (map[g.age] ?? 0) + inflated
    }
    const total = Object.values(map).reduce((a, b) => a + b, 0)
    return { giftAtAge: map, totalGifts: total }
  }, [plannedGifts, showRealValues, inflationRate, minCurrentAge])

  // Constant-rate withdrawal that draws the portfolio to ~$0 by endAge.
  const depletionRate =
    annualGrowth > 0 ? (annualGrowth / (1 - Math.pow(1 + annualGrowth, -years))) * 100 : 0

  const data = useMemo(() => {
    if (startBalance <= 0) return []

    const pathFor = (rate: number) => {
      const pts: number[] = []
      let b = startBalance
      for (let age = startAge; age <= endAge; age++) {
        b -= giftAtAge[age] ?? 0
        pts.push(Math.max(0, b))
        b = b * (1 + annualGrowth) - startBalance * (rate / 100)
      }
      return pts
    }

    const paths = RATES.map((r) => pathFor(r))
    const depletePath = depletionRate > 0 ? pathFor(depletionRate) : null

    const rows: Record<string, number>[] = []
    for (let i = 0; i < paths[0].length; i++) {
      const row: Record<string, number> = { age: startAge + i }
      RATES.forEach((r, idx) => {
        row[`${r}%`] = paths[idx][i]
      })
      if (depletePath) row['deplete'] = depletePath[i]
      rows.push(row)
    }
    return rows
  }, [startBalance, annualGrowth, startAge, endAge, depletionRate, giftAtAge])

  if (startBalance <= 0 || data.length === 0) return null

  const axisColor = isDarkMode ? '#9ca3af' : '#6b7280'
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb'
  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    border: `1px solid ${gridColor}`,
    borderRadius: '8px',
  }

  const depleteLabel = depletionRate > 0 ? `→$0 by ${endAge} (~${depletionRate.toFixed(1)}%)` : ''

  return (
    <div className="animate-fade-in-up-delay-3 card p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-rose-500" />
        Retirement Drawdown
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Each line withdraws a constant % of the starting balance every year ({showRealValues ? "today's dollars" : 'future dollars (nominal)'}, assuming the ~
        {(annualGrowth * 100).toFixed(1)}% average {showRealValues ? 'real' : 'nominal'} return). At {withdrawalRate}% the portfolio grows — the 4% rule is a
        survival floor, not a spend-it-all rate. Raise the rate and it draws down; the dashed line spends to ~$0 by {endAge}.
      </p>
      {totalGifts > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
          Includes a {formatMoney(totalGifts)} one-time drop for planned gifts at age {Object.keys(giftAtAge).join(', ')}.
        </p>
      )}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
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
            <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" />
            {RATES.map((r, idx) => (
              <Line
                key={r}
                dataKey={`${r}%`}
                stroke={RATE_COLORS[idx]}
                strokeWidth={2}
                dot={false}
              />
            ))}
            {depletionRate > 0 && (
              <Line
                dataKey="deplete"
                stroke="#7c3aed"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                name={depleteLabel}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        {RATES.map((r, idx) => (
          <div key={r} className="flex items-center gap-2">
            <span className="inline-block w-5 h-0.5" style={{ backgroundColor: RATE_COLORS[idx] }} />
            <span className="text-gray-700 dark:text-gray-300">{r}% withdrawal</span>
          </div>
        ))}
        {depletionRate > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-5 border-t-2 border-dashed"
              style={{ borderColor: '#7c3aed' }}
            />
            <span className="text-gray-700 dark:text-gray-300">{depleteLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}
