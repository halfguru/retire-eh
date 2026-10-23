// Quebec 2026 retirement tax estimate.
//
// This is an estimator, not a tax return. It models the 2026 federal and
// Quebec brackets, the Quebec abatement, the main non-refundable credits and
// the OAS recovery tax ("clawback"). It assumes RRSP contributions were
// already deducted during the working years, so only retirement income is
// taxed here.
//
// Approximations to keep in mind:
// - All income is assumed to be ordinary income (no capital gains/dividends).
// - The Quebec age and retirement-income amounts are phased out on individual
//   income, not net family income.
// - The pension income credit uses entered employer pension only.
// - effectiveRrspTaxRate is the incremental tax (including any OAS clawback)
//   caused by RRSP withdrawals, not the household's overall average rate.

export interface TaxBracket {
  upTo: number
  rate: number
}

export const FEDERAL_BRACKETS_2026: TaxBracket[] = [
  { upTo: 58523, rate: 14 },
  { upTo: 117045, rate: 20.5 },
  { upTo: 181440, rate: 26 },
  { upTo: 258482, rate: 29 },
  { upTo: Infinity, rate: 33 },
]

export const QUEBEC_BRACKETS_2026: TaxBracket[] = [
  { upTo: 54345, rate: 14 },
  { upTo: 108680, rate: 19 },
  { upTo: 132245, rate: 24 },
  { upTo: Infinity, rate: 25.75 },
]

const FEDERAL_LOWEST_RATE = 14
const QUEBEC_LOWEST_RATE = 14
const QUEBEC_ABATEMENT = 0.165

export const FEDERAL_BPA_2026 = 16452
const FEDERAL_BPA_MIN_2026 = 14538
const FEDERAL_BPA_PHASE_OUT_START_2026 = 181440
const FEDERAL_BPA_PHASE_OUT_END_2026 = 258482
export const FEDERAL_AGE_AMOUNT_2026 = 9208
export const FEDERAL_AGE_AMOUNT_THRESHOLD_2026 = 46432
export const FEDERAL_PENSION_AMOUNT_2026 = 2000

export const QUEBEC_BPA_2026 = 18952
export const QUEBEC_AGE_AMOUNT_2026 = 3986
export const QUEBEC_RETIREMENT_AMOUNT_2026 = 3541
export const QUEBEC_CREDIT_REDUCTION_THRESHOLD_2026 = 42955
export const QUEBEC_CREDIT_REDUCTION_RATE = 0.1875

export const OAS_MAX_ANNUAL_2026 = 9024
export const OAS_CLAWBACK_THRESHOLD_2026 = 95323
export const OAS_RECOVERY_RATE = 0.15

export function progressiveTax(income: number, brackets: TaxBracket[]): number {
  if (income <= 0) return 0
  let tax = 0
  let lower = 0
  for (const bracket of brackets) {
    if (income <= lower) break
    const taxable = Math.min(income, bracket.upTo) - lower
    if (taxable > 0) tax += taxable * (bracket.rate / 100)
    lower = bracket.upTo
  }
  return tax
}

export function marginalRate(income: number, brackets: TaxBracket[]): number {
  for (const bracket of brackets) {
    if (income < bracket.upTo) return bracket.rate
  }
  return brackets[brackets.length - 1]?.rate ?? 0
}

// The federal BPA phases down for high incomes (the "enhanced" portion).
function federalBasicPersonalAmount(income: number): number {
  if (income <= FEDERAL_BPA_PHASE_OUT_START_2026) return FEDERAL_BPA_2026
  if (income >= FEDERAL_BPA_PHASE_OUT_END_2026) return FEDERAL_BPA_MIN_2026
  const progress = (income - FEDERAL_BPA_PHASE_OUT_START_2026) /
    (FEDERAL_BPA_PHASE_OUT_END_2026 - FEDERAL_BPA_PHASE_OUT_START_2026)
  return FEDERAL_BPA_2026 - progress * (FEDERAL_BPA_2026 - FEDERAL_BPA_MIN_2026)
}

function federalAgeAmount(income: number): number {
  return Math.max(0, FEDERAL_AGE_AMOUNT_2026 - 0.15 * Math.max(0, income - FEDERAL_AGE_AMOUNT_THRESHOLD_2026))
}

function quebecAgeAndRetirementAmounts(
  income: number,
  age: number,
  eligiblePensionIncome: number,
): number {
  if (age < 65) return 0

  const retirementAmount = Math.min(
    QUEBEC_RETIREMENT_AMOUNT_2026,
    Math.max(0, eligiblePensionIncome) * 1.25,
  )
  const eligible = QUEBEC_AGE_AMOUNT_2026 + retirementAmount
  const reduction = Math.min(
    eligible,
    QUEBEC_CREDIT_REDUCTION_RATE * Math.max(0, income - QUEBEC_CREDIT_REDUCTION_THRESHOLD_2026),
  )
  return Math.max(0, eligible - reduction)
}

export function combinedMarginalRate(income: number): number {
  const federal = marginalRate(income, FEDERAL_BRACKETS_2026) * (1 - QUEBEC_ABATEMENT)
  const quebec = marginalRate(income, QUEBEC_BRACKETS_2026)
  return federal + quebec
}

export interface PersonTaxInput {
  taxableIncome: number
  age: number
  oasReceived: number
  eligiblePensionIncome: number
}

export interface PersonTaxResult {
  federal: number
  quebec: number
  oasClawback: number
  total: number
  marginalRate: number
}

export function computePersonTax({
  taxableIncome,
  age,
  oasReceived,
  eligiblePensionIncome,
}: PersonTaxInput): PersonTaxResult {
  const netIncome = Math.max(0, taxableIncome)

  const oasClawback = Math.min(
    Math.max(0, oasReceived),
    OAS_RECOVERY_RATE * Math.max(0, netIncome - OAS_CLAWBACK_THRESHOLD_2026),
  )
  const taxableIncomeAfterClawback = Math.max(0, netIncome - oasClawback)

  let federalCredits = federalBasicPersonalAmount(netIncome)
  if (age >= 65) federalCredits += federalAgeAmount(netIncome)
  federalCredits += Math.min(FEDERAL_PENSION_AMOUNT_2026, Math.max(0, eligiblePensionIncome))

  const federalBeforeCredits = progressiveTax(taxableIncomeAfterClawback, FEDERAL_BRACKETS_2026)
  const federalAfterCredits = Math.max(0, federalBeforeCredits - federalCredits * (FEDERAL_LOWEST_RATE / 100))
  const federal = federalAfterCredits * (1 - QUEBEC_ABATEMENT)

  const quebecCredits =
    QUEBEC_BPA_2026 + quebecAgeAndRetirementAmounts(netIncome, age, eligiblePensionIncome)

  const quebecBeforeCredits = progressiveTax(taxableIncomeAfterClawback, QUEBEC_BRACKETS_2026)
  const quebec = Math.max(0, quebecBeforeCredits - quebecCredits * (QUEBEC_LOWEST_RATE / 100))

  return {
    federal,
    quebec,
    oasClawback,
    total: federal + quebec + oasClawback,
    marginalRate: combinedMarginalRate(taxableIncomeAfterClawback),
  }
}

export interface RetirementIncomePerson {
  name: string
  ageAtRetirement: number
  pension: number
  cpp: number
  oas: number
}

export interface PersonRetirementTax extends PersonTaxResult {
  name: string
  ageAtRetirement: number
  pension: number
  cpp: number
  oas: number
  rrifWithdrawal: number
  taxableIncome: number
}

export interface RetirementTaxSummary {
  perPerson: PersonRetirementTax[]
  guaranteedIncome: number
  portfolioWithdrawal: number
  taxableWithdrawal: number
  taxFreeWithdrawal: number
  rrspTax: number
  totalTax: number
  oasClawback: number
  preTaxIncome: number
  afterTaxIncome: number
  averageTaxRate: number
  effectiveRrspTaxRate: number
  topMarginalRate: number
}

// Split taxable RRIF withdrawals across people to minimize household tax:
// repeatedly add the next slice to whoever is in the lowest marginal bracket.
function allocateTaxableWithdrawal(baseIncomes: number[], total: number): number[] {
  const allocation = baseIncomes.map(() => 0)
  if (total <= 0 || baseIncomes.length === 0) return allocation

  const STEP = 500
  let remaining = total
  while (remaining > 0) {
    let bestIndex = 0
    let bestRate = Infinity
    for (let i = 0; i < baseIncomes.length; i++) {
      const rate = combinedMarginalRate(baseIncomes[i] + allocation[i])
      if (rate < bestRate) {
        bestRate = rate
        bestIndex = i
      }
    }
    const chunk = Math.min(STEP, remaining)
    allocation[bestIndex] += chunk
    remaining -= chunk
  }
  return allocation
}

export function computeRetirementTaxSummary(params: {
  people: RetirementIncomePerson[]
  rrspAtRetirement: number
  tfsaAtRetirement: number
  portfolioWithdrawal: number
}): RetirementTaxSummary {
  const { people, rrspAtRetirement, tfsaAtRetirement, portfolioWithdrawal } = params

  const guaranteedIncome = people.reduce((sum, p) => sum + p.pension + p.cpp + p.oas, 0)
  const totalBalances = Math.max(0, rrspAtRetirement) + Math.max(0, tfsaAtRetirement)
  const rrspShare = totalBalances > 0 ? Math.max(0, rrspAtRetirement) / totalBalances : 0

  const withdrawal = Math.max(0, portfolioWithdrawal)
  const taxableWithdrawal = withdrawal * rrspShare
  const taxFreeWithdrawal = withdrawal - taxableWithdrawal

  const baseIncomes = people.map(p => Math.max(0, p.pension + p.cpp + p.oas))
  const allocation = allocateTaxableWithdrawal(baseIncomes, taxableWithdrawal)

  const perPerson: PersonRetirementTax[] = people.map((p, i) => {
    const taxableIncome = baseIncomes[i] + allocation[i]
    const tax = computePersonTax({
      taxableIncome,
      age: p.ageAtRetirement,
      oasReceived: p.oas,
      eligiblePensionIncome: p.pension,
    })
    return {
      name: p.name,
      ageAtRetirement: p.ageAtRetirement,
      pension: p.pension,
      cpp: p.cpp,
      oas: p.oas,
      rrifWithdrawal: allocation[i],
      taxableIncome: Math.max(0, taxableIncome - tax.oasClawback),
      ...tax,
    }
  })

  const totalTax = perPerson.reduce((sum, p) => sum + p.total, 0)
  const oasClawback = perPerson.reduce((sum, p) => sum + p.oasClawback, 0)
  const preTaxIncome = guaranteedIncome + withdrawal
  const afterTaxIncome = Math.max(0, preTaxIncome - totalTax)
  const averageTaxRate = preTaxIncome > 0 ? (totalTax / preTaxIncome) * 100 : 0
  const topMarginalRate = perPerson.reduce((max, p) => Math.max(max, p.marginalRate), 0)

  // The household average rate includes low-tax guaranteed income, so using it
  // to value the RRSP overstates after-tax net worth. Instead, isolate the tax
  // that the RRSP withdrawals actually add (including any OAS clawback they
  // trigger) by comparing against the same income without those withdrawals.
  const taxWithoutRrsp = people.reduce((sum, p) => {
    const baseIncome = Math.max(0, p.pension + p.cpp + p.oas)
    return sum + computePersonTax({
      taxableIncome: baseIncome,
      age: p.ageAtRetirement,
      oasReceived: p.oas,
      eligiblePensionIncome: p.pension,
    }).total
  }, 0)
  const rrspTax = Math.max(0, totalTax - taxWithoutRrsp)
  const effectiveRrspTaxRate = taxableWithdrawal > 0
    ? Math.min(100, (rrspTax / taxableWithdrawal) * 100)
    : 0

  return {
    perPerson,
    guaranteedIncome,
    portfolioWithdrawal: withdrawal,
    taxableWithdrawal,
    taxFreeWithdrawal,
    rrspTax,
    totalTax,
    oasClawback,
    preTaxIncome,
    afterTaxIncome,
    averageTaxRate,
    effectiveRrspTaxRate,
    topMarginalRate,
  }
}
