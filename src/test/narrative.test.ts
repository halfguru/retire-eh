import { describe, it, expect } from 'vitest'
import { buildPlanNarrative, type PlanNarrativeInput } from '@/lib/narrative'

const base: PlanNarrativeInput = {
  people: [
    { name: 'Simon', currentAge: 34, retirementAge: 65 },
    { name: 'Jessie', currentAge: 35, retirementAge: 58 },
  ],
  totalPortfolio: 187000,
  totalAnnualContributions: 20000,
  totalAnnualIncome: 230000,
  householdRetirementAge: 65,
  yearsToRetirement: 31,
  expectedReturn: 7,
  inflationRate: 2.5,
  replacementRate: 60,
  withdrawalRate: 4,
  showRealValues: true,
  giftTotal: 200000,
  portfolioAtRetirement: 1456106,
  requiredPortfolio: 700000,
  requiredAnnualIncome: 138000,
  projectedAnnualIncome: 174492,
  afterTaxAnnualIncome: 144079,
  guaranteedAnnualIncome: 124248,
  portfolioWithdrawal: 50244,
  progress: 100,
  gap: -756106,
  additionalAnnualSavings: 0,
  taxTotal: 30413,
  oasClawback: 270,
}

describe('buildPlanNarrative', () => {
  it('asks for details when there are no people', () => {
    const result = buildPlanNarrative({ ...base, people: [] })
    expect(result.status).toBe('empty')
    expect(result.headline).toMatch(/add your details/i)
  })

  it('asks for income when no income is entered', () => {
    const result = buildPlanNarrative({
      ...base,
      totalAnnualIncome: 0,
      requiredAnnualIncome: 0,
      requiredPortfolio: 0,
      progress: 0,
      gap: 0,
    })
    expect(result.status).toBe('no-income')
    expect(result.headline).toMatch(/add your income/i)
    expect(result.paragraphs[0]).toContain('$187,000')
  })

  it('summarizes an on-track household plan', () => {
    const result = buildPlanNarrative(base)
    expect(result.status).toBe('on-track')
    expect(result.headline).toBe("You're on track")
    expect(result.paragraphs[0]).toContain('Simon (34) and Jessie (35)')
    expect(result.paragraphs[0]).toContain('$20,000')
    expect(result.paragraphs[0]).toContain("today's dollars")
    expect(result.paragraphs[1]).toContain('$1,456,106')
    expect(result.paragraphs[1]).toContain('$756,106 above')
    expect(result.paragraphs[1]).toContain('planned gifts')
    expect(result.paragraphs[2]).toContain('$174,492')
    expect(result.paragraphs[2]).toContain('$144,079')
    expect(result.paragraphs[2]).toContain('OAS clawback')
  })

  it('flags a close plan', () => {
    const result = buildPlanNarrative({
      ...base,
      progress: 95,
      gap: 50000,
      additionalAnnualSavings: 10000,
    })
    expect(result.status).toBe('close')
    expect(result.headline).toBe("You're close")
    expect(result.paragraphs[1]).toContain('short of')
  })

  it('flags a gap and the extra savings needed', () => {
    const result = buildPlanNarrative({
      ...base,
      portfolioAtRetirement: 450000,
      progress: 50,
      gap: 250000,
      additionalAnnualSavings: 25000,
      taxTotal: 0,
      oasClawback: 0,
    })
    expect(result.status).toBe('off-track')
    expect(result.headline).toBe("There's a gap to close")
    expect(result.paragraphs[1]).toContain('$250,000 short')
    expect(result.paragraphs[2]).toContain('$25,000 more a year')
  })

  it('uses future-dollar wording in nominal mode', () => {
    const result = buildPlanNarrative({ ...base, showRealValues: false })
    expect(result.paragraphs[0]).toContain('future dollars')
    expect(result.paragraphs[1]).toContain('future dollars')
  })

  it('uses second person for a single person', () => {
    const result = buildPlanNarrative({
      ...base,
      people: [{ name: 'You', currentAge: 34, retirementAge: 65 }],
    })
    expect(result.paragraphs[0]).toMatch(/^You're/)
  })

  it('suggests retiring later when there are no accumulation years left', () => {
    const result = buildPlanNarrative({
      ...base,
      yearsToRetirement: 0,
      progress: 50,
      gap: 250000,
      additionalAnnualSavings: 0,
    })
    expect(result.paragraphs[2]).toContain('Retiring later')
  })
})
