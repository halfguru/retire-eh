import {
  getCppIncomeAtAge,
  getOasIncomeAtAge,
  type PlannedGiftLite,
} from '@/lib/calculations'
import { computeRetirementTaxSummary, OAS_MAX_ANNUAL_2026 } from '@/lib/tax'

export interface CashFlowPerson {
  name: string
  currentAge: number
  annualPension: number
  annualCpp?: number
  cppStartAge?: number
  oasStartAge?: number
}

export interface RetirementCashFlowParams {
  people: CashFlowPerson[]
  rrspAtRetirement: number
  tfsaAtRetirement: number
  expectedReturnPct: number
  inflationPct: number
  withdrawalRatePct: number
  householdRetirementAge: number
  yearsToRetirement: number
  endAge?: number
  showRealValues?: boolean
  plannedGifts?: PlannedGiftLite[]
  currentYear?: number
}

export interface RetirementCashFlowYear {
  age: number
  year: number
  cpp: number
  oas: number
  pension: number
  rrspWithdrawal: number
  tfsaWithdrawal: number
  portfolioWithdrawal: number
  grossIncome: number
  tax: number
  oasClawback: number
  afterTaxIncome: number
  portfolioEnd: number
}

// Deterministic year-by-year retirement cash flow. The portfolio pays a constant
// real withdrawal based on the starting balance; tax is estimated each year from
// the income sources that are actually active at each person's age.
export function buildRetirementCashFlow(
  params: RetirementCashFlowParams,
): RetirementCashFlowYear[] {
  const {
    people,
    rrspAtRetirement,
    tfsaAtRetirement,
    expectedReturnPct,
    inflationPct,
    withdrawalRatePct,
    householdRetirementAge,
    yearsToRetirement,
    endAge = 95,
    showRealValues = true,
    plannedGifts = [],
    currentYear = new Date().getFullYear(),
  } = params

  if (people.length === 0 || endAge < householdRetirementAge) return []

  const realReturn = (1 + expectedReturnPct / 100) / (1 + inflationPct / 100) - 1
  const annualWithdrawal = (Math.max(0, rrspAtRetirement) + Math.max(0, tfsaAtRetirement)) *
    (withdrawalRatePct / 100)

  const giftAtAge: Record<number, number> = {}
  for (const gift of plannedGifts) {
    giftAtAge[gift.age] = (giftAtAge[gift.age] ?? 0) + gift.amount
  }

  let rrsp = Math.max(0, rrspAtRetirement)
  let tfsa = Math.max(0, tfsaAtRetirement)
  const rows: RetirementCashFlowYear[] = []

  for (let age = householdRetirementAge; age <= endAge; age++) {
    const offset = age - householdRetirementAge

    const incomePeople = people.map(p => {
      const personAge = p.currentAge + yearsToRetirement + offset
      return {
        name: p.name,
        ageAtRetirement: personAge,
        pension: p.annualPension || 0,
        cpp: getCppIncomeAtAge(p.annualCpp, p.cppStartAge, personAge),
        oas: getOasIncomeAtAge(OAS_MAX_ANNUAL_2026, p.oasStartAge, personAge),
      }
    })

    const totalBeforeGift = rrsp + tfsa
    const gift = Math.min(totalBeforeGift, giftAtAge[age] ?? 0)
    const giftRrsp = totalBeforeGift > 0 ? gift * (rrsp / totalBeforeGift) : 0
    const giftTfsa = gift - giftRrsp

    const rrspAfterGift = Math.max(0, rrsp - giftRrsp)
    const tfsaAfterGift = Math.max(0, tfsa - giftTfsa)
    const available = rrspAfterGift + tfsaAfterGift
    const withdrawal = Math.min(available, annualWithdrawal)

    const rrspWithdrawal = available > 0 ? withdrawal * (rrspAfterGift / available) : 0
    const tfsaWithdrawal = withdrawal - rrspWithdrawal

    const taxSummary = computeRetirementTaxSummary({
      people: incomePeople,
      rrspAtRetirement: rrspAfterGift,
      tfsaAtRetirement: tfsaAfterGift,
      portfolioWithdrawal: withdrawal,
    })

    const cpp = incomePeople.reduce((sum, p) => sum + p.cpp, 0)
    const oas = incomePeople.reduce((sum, p) => sum + p.oas, 0)
    const pension = incomePeople.reduce((sum, p) => sum + p.pension, 0)
    const grossIncome = taxSummary.guaranteedIncome + withdrawal
    const inflationFactor = showRealValues
      ? 1
      : Math.pow(1 + inflationPct / 100, yearsToRetirement + offset)

    rows.push({
      age,
      year: currentYear + yearsToRetirement + offset,
      cpp: cpp * inflationFactor,
      oas: oas * inflationFactor,
      pension: pension * inflationFactor,
      rrspWithdrawal: rrspWithdrawal * inflationFactor,
      tfsaWithdrawal: tfsaWithdrawal * inflationFactor,
      portfolioWithdrawal: withdrawal * inflationFactor,
      grossIncome: grossIncome * inflationFactor,
      tax: taxSummary.totalTax * inflationFactor,
      oasClawback: taxSummary.oasClawback * inflationFactor,
      afterTaxIncome: Math.max(0, grossIncome - taxSummary.totalTax) * inflationFactor,
      portfolioEnd: (rrspAfterGift - rrspWithdrawal + tfsaAfterGift - tfsaWithdrawal) *
        (1 + realReturn) * inflationFactor,
    })

    rrsp = (rrspAfterGift - rrspWithdrawal) * (1 + realReturn)
    tfsa = (tfsaAfterGift - tfsaWithdrawal) * (1 + realReturn)
  }

  return rows
}
