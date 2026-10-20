import { usePeople } from '@/contexts/PeopleContext'
import { useProjectionContext } from '@/contexts/ProjectionContext'
import {
  CPP_BASELINE_AGE,
  CPP_MAX_START_AGE,
  CPP_MIN_START_AGE,
  OAS_BASELINE_AGE,
  OAS_MAX_START_AGE,
  getCppIncomeAtAge,
  getOasIncomeAtAge,
} from '@/lib/calculations'
import { OAS_MAX_ANNUAL_2026 } from '@/lib/tax'
import { formatMoney } from '@/lib/formatting'
import { CalendarClock } from 'lucide-react'

const CPP_COMPARISON_AGES = [CPP_MIN_START_AGE, CPP_BASELINE_AGE, CPP_MAX_START_AGE]
const OAS_COMPARISON_AGES = [OAS_BASELINE_AGE, OAS_MAX_START_AGE]
const LIFETIME_TO_AGE = 95

interface BenefitRow {
  startAge: number
  annual: number
  changeFrom65: number | null
  lifetime: number
}

function buildRows(
  ages: number[],
  getAnnual: (startAge: number) => number,
): BenefitRow[] {
  const baseline = getAnnual(CPP_BASELINE_AGE)

  return ages.map((startAge) => {
    const annual = getAnnual(startAge)
    return {
      startAge,
      annual,
      changeFrom65: baseline > 0 ? annual / baseline - 1 : null,
      lifetime: annual * Math.max(0, LIFETIME_TO_AGE - startAge),
    }
  })
}

function BenefitTable({
  title,
  rows,
  selectedStartAge,
}: {
  title: string
  rows: BenefitRow[]
  selectedStartAge: number
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Selected: age {selectedStartAge}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th className="py-2 pr-3 font-medium">Start</th>
              <th className="py-2 pr-3 font-medium">Annual</th>
              <th className="py-2 pr-3 font-medium">vs. 65</th>
              <th className="py-2 font-medium">Paid to 95*</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isSelected = row.startAge === selectedStartAge
              return (
                <tr
                  key={row.startAge}
                  className={
                    isSelected
                      ? 'border-b border-indigo-100 bg-indigo-50/70 font-medium text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-200'
                      : 'border-b border-gray-100 text-gray-700 last:border-0 dark:border-gray-700/60 dark:text-gray-300'
                  }
                >
                  <td className="py-2 pr-3">
                    {row.startAge}
                    {isSelected && <span className="ml-1.5 text-[10px] uppercase tracking-wide">active</span>}
                  </td>
                  <td className="py-2 pr-3">${formatMoney(row.annual)}</td>
                  <td className="py-2 pr-3">
                    {row.changeFrom65 === null
                      ? '—'
                      : row.changeFrom65 === 0
                        ? '—'
                        : `${row.changeFrom65 > 0 ? '+' : ''}${Math.round(row.changeFrom65 * 100)}%`}
                  </td>
                  <td className="py-2">${formatMoney(row.lifetime)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BenefitTimingCard() {
  const { people } = usePeople()
  const projection = useProjectionContext()

  if (people.length === 0) return null

  return (
    <div className="card p-4 sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
        <CalendarClock className="h-5 w-5 text-indigo-500" />
        3. Government Benefit Timing
      </h2>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        CPP &amp; OAS start-age comparison. Starting earlier gives more years of payments; starting later gives a
        permanently larger amount.
        Amounts are in 2026 dollars and are before tax and OAS clawback.
      </p>

      <div className="space-y-6">
        {people.map(person => {
          const ageAtRetirement = person.currentAge + projection.yearsToRetirement
          const cppStartAge = person.cppStartAge ?? CPP_BASELINE_AGE
          const oasStartAge = person.oasStartAge ?? OAS_BASELINE_AGE
          const cppAtRetirement = getCppIncomeAtAge(person.annualCpp, cppStartAge, ageAtRetirement)
          const oasAtRetirement = getOasIncomeAtAge(OAS_MAX_ANNUAL_2026, oasStartAge, ageAtRetirement)

          const cppRows = buildRows(CPP_COMPARISON_AGES, age =>
            getCppIncomeAtAge(person.annualCpp, age, age)
          )
          const oasRows = buildRows(OAS_COMPARISON_AGES, age =>
            getOasIncomeAtAge(OAS_MAX_ANNUAL_2026, age, age)
          )

          return (
            <div key={person.id} className="rounded-lg border border-gray-200 p-3 sm:p-4 dark:border-gray-700">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-800 dark:text-white">{person.name}</h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  CPP {cppStartAge} · OAS {oasStartAge}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <BenefitTable title="CPP" rows={cppRows} selectedStartAge={cppStartAge} />
                <BenefitTable title="OAS" rows={oasRows} selectedStartAge={oasStartAge} />
              </div>

              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                At household retirement (age {ageAtRetirement}), this plan counts{' '}
                <strong className="text-gray-700 dark:text-gray-200">${formatMoney(cppAtRetirement)} CPP</strong> and{' '}
                <strong className="text-gray-700 dark:text-gray-200">${formatMoney(oasAtRetirement)} OAS</strong>.
                {oasAtRetirement === 0 && oasStartAge > ageAtRetirement
                  ? ` OAS is deferred to age ${oasStartAge}, so it is not counted at retirement.`
                  : ''}
              </p>
            </div>
          )
        })}
      </div>

      <p className="mt-4 border-t border-gray-200 pt-3 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
        * Undiscounted payments if benefits start at that age and continue to age {LIFETIME_TO_AGE}. CPP and OAS are
        indexed to inflation; this comparison does not model inflation, taxes, or the OAS clawback. Actual amounts
        depend on contribution history and residency.
      </p>
    </div>
  )
}
