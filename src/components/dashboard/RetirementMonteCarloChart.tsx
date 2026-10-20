import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { runRetirementMonteCarlo } from '@/lib/projectionSim'
import { formatCompactMoney, formatMoney } from '@/lib/formatting'
import { Activity } from 'lucide-react'

interface RetirementMonteCarloChartProps {
  isDarkMode: boolean
  startBalance: number
  expectedReturn: number
  inflationRate: number
  withdrawalRate: number
  startAge: number
  endAge?: number
  showRealValues: boolean
}

export function RetirementMonteCarloChart({
  isDarkMode,
  startBalance,
  expectedReturn,
  inflationRate,
  withdrawalRate,
  startAge,
  endAge = 95,
  showRealValues,
}: RetirementMonteCarloChartProps) {
  const { data, successRate, finalMedian, finalP10, annualWithdrawal } = useMemo(() => {
    if (startBalance <= 0 || endAge <= startAge) {
      return { data: [], successRate: 0, finalMedian: 0, finalP10: 0, annualWithdrawal: 0 }
    }

    const result = runRetirementMonteCarlo({
      startBalance,
      expectedReturnPct: expectedReturn,
      inflationPct: inflationRate,
      withdrawalRatePct: withdrawalRate,
      startAge,
      endAge,
      showRealValues,
    })

    const final = result.paths[result.paths.length - 1]
    return {
      data: result.paths.map((d) => ({
        age: d.age,
        p10: d.p10,
        outerBand: d.p90 - d.p10,
        p25: d.p25,
        innerBand: d.p75 - d.p25,
        p50: d.p50,
      })),
      successRate: result.successRate,
      finalMedian: final?.p50 ?? 0,
      finalP10: final?.p10 ?? 0,
      annualWithdrawal: startBalance * (withdrawalRate / 100),
    }
  }, [startBalance, expectedReturn, inflationRate, withdrawalRate, startAge, endAge, showRealValues])

  if (startBalance <= 0 || data.length === 0) return null

  const successPct = Math.round(successRate * 100)
  const successColor = successPct >= 85
    ? 'text-emerald-600 dark:text-emerald-400'
    : successPct >= 70
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400'

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
        Retirement Monte Carlo
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        500 simulations of the spending phase with market volatility. Bands show the 10–90% and 25–75%
        portfolio ranges in {showRealValues ? "today's" : 'future (nominal)'} dollars. Portfolio only —
        CPP, OAS, and pension income are separate.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-center">
          <div className={`text-2xl font-bold ${successColor}`}>{successPct}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            chance the portfolio lasts to {endAge}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">${formatMoney(finalMedian)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            median balance at {endAge}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">${formatMoney(finalP10)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            10th-percentile balance at {endAge}
          </div>
        </div>
      </div>

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
            <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" />
            <Area dataKey="p10" stackId="o" stroke="none" fill="transparent" name="10–90% range" />
            <Area dataKey="outerBand" stackId="o" stroke="none" fill="#6366f1" fillOpacity={0.18} name="10–90% range" />
            <Area dataKey="p25" stackId="i" stroke="none" fill="transparent" name="25–75% range" />
            <Area dataKey="innerBand" stackId="i" stroke="none" fill="#6366f1" fillOpacity={0.15} name="25–75% range" />
            <Line dataKey="p50" stroke="#4338ca" strokeWidth={2} dot={false} name="Median" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Starting withdrawal: ${formatMoney(annualWithdrawal)}/year ({withdrawalRate.toFixed(1)}% of the
        retirement balance).
      </p>
    </div>
  )
}
