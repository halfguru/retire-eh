import { formatMoney } from './formatting'

export interface NarrativePerson {
  name: string
  currentAge: number
  retirementAge: number
}

export interface PlanNarrativeInput {
  people: NarrativePerson[]
  totalPortfolio: number
  totalAnnualContributions: number
  totalAnnualIncome: number
  householdRetirementAge: number
  yearsToRetirement: number
  expectedReturn: number
  inflationRate: number
  replacementRate: number
  withdrawalRate: number
  showRealValues: boolean
  giftTotal: number
  portfolioAtRetirement: number
  requiredPortfolio: number
  requiredAnnualIncome: number
  projectedAnnualIncome: number
  afterTaxAnnualIncome: number
  guaranteedAnnualIncome: number
  portfolioWithdrawal: number
  progress: number
  gap: number
  additionalAnnualSavings: number
  taxTotal?: number
  oasClawback?: number
}

export type PlanNarrativeStatus = 'empty' | 'no-income' | 'on-track' | 'close' | 'off-track'

export interface PlanNarrative {
  status: PlanNarrativeStatus
  headline: string
  paragraphs: string[]
}

function money(value: number): string {
  return `$${formatMoney(Math.round(value))}`
}

function joinNames(people: NarrativePerson[]): string {
  if (people.length === 1) return people[0].name
  if (people.length === 2) {
    return `${people[0].name} (${people[0].currentAge}) and ${people[1].name} (${people[1].currentAge})`
  }
  return 'Your household'
}

export function buildPlanNarrative(input: PlanNarrativeInput): PlanNarrative {
  const {
    people,
    totalPortfolio,
    totalAnnualContributions,
    totalAnnualIncome,
    householdRetirementAge,
    yearsToRetirement,
    expectedReturn,
    inflationRate,
    replacementRate,
    withdrawalRate,
    showRealValues,
    giftTotal,
    portfolioAtRetirement,
    requiredPortfolio,
    requiredAnnualIncome,
    projectedAnnualIncome,
    afterTaxAnnualIncome,
    guaranteedAnnualIncome,
    portfolioWithdrawal,
    progress,
    gap,
    additionalAnnualSavings,
    taxTotal = 0,
    oasClawback = 0,
  } = input

  if (people.length === 0) {
    return {
      status: 'empty',
      headline: 'Add your details to see the story',
      paragraphs: [
        "Once you add a person, income, and accounts, this summary will explain where your plan is headed and whether you're on track.",
      ],
    }
  }

  const retirementClause = people.length === 1
    ? `and plan to retire at ${people[0].retirementAge}`
    : `and plan to retire at ${people.map(p => `${p.retirementAge} (${p.name})`).join(' and ')}`

  if (totalAnnualIncome <= 0) {
    const subject = people.length === 1 ? "You're" : `${joinNames(people)} are`
    return {
      status: 'no-income',
      headline: 'Add your income to set a target',
      paragraphs: [
        `${subject} starting with ${money(totalPortfolio)} invested ${retirementClause}. Add your income and a replacement rate to see whether that is enough.`,
      ],
    }
  }

  const isOnTrack = gap <= 0
  const isClose = !isOnTrack && progress >= 90
  const status: PlanNarrativeStatus = isOnTrack ? 'on-track' : isClose ? 'close' : 'off-track'

  const subject = people.length === 1
    ? "You're"
    : people.length === 2
      ? `${joinNames(people)} are`
      : 'Your household is'
  const savingClause = totalAnnualContributions > 0
    ? `adding ${money(totalAnnualContributions)} a year to ${money(totalPortfolio)} already invested`
    : `${money(totalPortfolio)} already invested`
  const basis = showRealValues ? "in today's dollars" : 'in future dollars'
  const growthClause = `The projection assumes ${expectedReturn}% annual growth and ${inflationRate}% inflation, and all figures are ${basis}.`

  const comparison = gap <= 0
    ? `That's about ${money(Math.abs(gap))} above your ${money(requiredPortfolio)} target.`
    : `That's about ${money(gap)} short of your ${money(requiredPortfolio)} target.`
  const giftSentence = giftTotal > 0
    ? ` Your target includes a ${money(giftTotal)} reserve for planned gifts.`
    : ''

  const guaranteedSentence = guaranteedAnnualIncome > 0
    ? ` Guaranteed income of ${money(guaranteedAnnualIncome)} covers part of that; the portfolio supplies ${money(portfolioWithdrawal)} at ${withdrawalRate}%.`
    : ` The portfolio supplies ${money(portfolioWithdrawal)} at ${withdrawalRate}%.`
  const taxSentence = taxTotal > 0
    ? ` Estimated 2026 Quebec tax is about ${money(taxTotal)}${oasClawback > 0 ? `, including ${money(oasClawback)} of OAS clawback` : ''}.`
    : ''
  const leverSentence = gap <= 0
    ? ` That leaves about ${money(Math.abs(gap))} of cushion.`
    : yearsToRetirement > 0
      ? ` Saving about ${money(additionalAnnualSavings)} more a year would close the gap.`
      : ' Retiring later or trimming the target would close the gap.'

  const headline = isOnTrack
    ? "You're on track"
    : isClose
      ? "You're close"
      : "There's a gap to close"

  return {
    status,
    headline,
    paragraphs: [
      `${subject} ${savingClause} ${retirementClause}. ${growthClause}`,
      `By age ${householdRetirementAge}, the household portfolio is projected to reach about ${money(portfolioAtRetirement)} ${basis}. ${comparison}${giftSentence}`,
      `That supports about ${money(projectedAnnualIncome)} a year before tax and ${money(afterTaxAnnualIncome)} after tax, against a ${money(requiredAnnualIncome)} pre-tax target (${replacementRate}% of income).${guaranteedSentence}${taxSentence}${leverSentence}`,
    ],
  }
}
