import { useMemo } from 'react'
import { usePeople } from '@/contexts/PeopleContext'
import { useAssumptions } from '@/contexts/AssumptionsContext'
import { useProjectionContext } from '@/contexts/ProjectionContext'
import { buildRetirementCashFlow } from '@/lib/retirementCashFlow'
import { formatMoney } from '@/lib/formatting'
import { ModeBadge } from '@/components/ui/ModeBadge'
import { Table2 } from 'lucide-react'

export function RetirementCashFlowTable() {
  const { people } = usePeople()
  const assumptions = useAssumptions()
  const projection = useProjectionContext()

  const rows = useMemo(() => {
    const lastPoint = projection.realProjectionData[projection.realProjectionData.length - 1]
    return buildRetirementCashFlow({
      people,
      rrspAtRetirement: lastPoint?.RRSP ?? 0,
      tfsaAtRetirement: lastPoint?.TFSA ?? 0,
      expectedReturnPct: assumptions.expectedReturn,
      inflationPct: assumptions.inflationRate,
      withdrawalRatePct: assumptions.withdrawalRate,
      householdRetirementAge: projection.householdRetirementAge,
      yearsToRetirement: projection.yearsToRetirement,
      showRealValues: assumptions.showRealValues,
      plannedGifts: assumptions.plannedGifts,
    })
  }, [
    people,
    assumptions.expectedReturn,
    assumptions.inflationRate,
    assumptions.withdrawalRate,
    assumptions.showRealValues,
    assumptions.plannedGifts,
    projection.realProjectionData,
    projection.householdRetirementAge,
    projection.yearsToRetirement,
  ])

  if (rows.length === 0) return null

  const depletion = rows.find(row => row.portfolioEnd <= 0)
  const giftsTotal = assumptions.plannedGifts.reduce((sum, gift) => sum + gift.amount, 0)

  return (
    <div className="animate-fade-in-up-delay-3 card p-4 sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-white">
        <Table2 className="h-5 w-5 text-indigo-500" />
        Retirement Cash Flow
        <ModeBadge showRealValues={assumptions.showRealValues} />
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Year-by-year estimate from retirement to age {rows[rows.length - 1].age}. Assumes a constant{' '}
        {assumptions.withdrawalRate}% withdrawal from the starting portfolio and proportional RRSP/TFSA withdrawals.
      </p>

      {depletion && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          The portfolio reaches $0 around age {depletion.age}. CPP, OAS, and pension income continue.
        </div>
      )}

      <div className="max-h-[36rem] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[920px] border-collapse text-xs sm:text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/95 text-left text-gray-500 backdrop-blur dark:bg-gray-900/95 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 font-medium">Year</th>
              <th className="px-3 py-2 font-medium">Age</th>
              <th className="px-3 py-2 text-right font-medium">CPP</th>
              <th className="px-3 py-2 text-right font-medium">OAS</th>
              <th className="px-3 py-2 text-right font-medium">Pension</th>
              <th className="px-3 py-2 text-right font-medium">RRSP/RRIF</th>
              <th className="px-3 py-2 text-right font-medium">TFSA</th>
              <th className="px-3 py-2 text-right font-medium">Gross</th>
              <th className="px-3 py-2 text-right font-medium">Tax</th>
              <th className="px-3 py-2 text-right font-medium">After-tax</th>
              <th className="px-3 py-2 text-right font-medium">Portfolio end</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.year}
                className="border-t border-gray-100 text-gray-700 dark:border-gray-700/60 dark:text-gray-300"
              >
                <td className="px-3 py-1.5">{row.year}</td>
                <td className="px-3 py-1.5">{row.age}</td>
                <td className="px-3 py-1.5 text-right">${formatMoney(row.cpp)}</td>
                <td className="px-3 py-1.5 text-right">${formatMoney(row.oas)}</td>
                <td className="px-3 py-1.5 text-right">${formatMoney(row.pension)}</td>
                <td className="px-3 py-1.5 text-right">${formatMoney(row.rrspWithdrawal)}</td>
                <td className="px-3 py-1.5 text-right">${formatMoney(row.tfsaWithdrawal)}</td>
                <td className="px-3 py-1.5 text-right font-medium text-gray-900 dark:text-gray-100">
                  ${formatMoney(row.grossIncome)}
                </td>
                <td className="px-3 py-1.5 text-right text-rose-600 dark:text-rose-400">
                  ${formatMoney(row.tax)}
                </td>
                <td className="px-3 py-1.5 text-right font-medium text-emerald-700 dark:text-emerald-400">
                  ${formatMoney(row.afterTaxIncome)}
                </td>
                <td className="px-3 py-1.5 text-right">${formatMoney(row.portfolioEnd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        <p>
          Tax includes federal and Quebec income tax plus the OAS clawback. TFSA withdrawals are excluded from taxable
          income. The OAS clawback is deducted before tax. RRIF minimum withdrawals are not modeled.
        </p>
        {giftsTotal > 0 && (
          <p>Includes {formatMoney(giftsTotal)} of planned gifts at their specified ages, deducted from the portfolio.</p>
        )}
        <p>
          Age is shown for the younger spouse; each person&apos;s CPP and OAS use their own age.
          {assumptions.showRealValues
            ? ' Values are in today\'s dollars.'
            : ' Future-dollar values inflate the real plan each year; tax brackets are not indexed.'}
        </p>
      </div>
    </div>
  )
}
