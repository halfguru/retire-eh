import { describe, it, expect } from 'vitest'
import { buildRetirementPlan } from '@/lib/yaml-utils'
import { buildShareUrl, decodePlan, encodePlan, readSharePlanFromUrl } from '@/lib/share-link'
import type { Person } from '@/types/person'
import type { PlanAssumptions } from '@/types/plan'

const assumptions: PlanAssumptions = {
  expectedReturn: 7,
  inflationRate: 2.5,
  replacementRate: 70,
  withdrawalRate: 4,
  showRealValues: true,
  plannedGifts: [],
}

const people: Person[] = [
  {
    id: 'person-1',
    name: 'Alice',
    currentAge: 40,
    retirementAge: 65,
    annualIncome: 100000,
    annualPension: 0,
    annualCpp: 18092,
    cppStartAge: 65,
    oasStartAge: 70,
    accounts: [
      { id: 'account-1', type: 'RRSP', balance: 250000, annualContribution: 12000 },
      { id: 'account-2', type: 'TFSA', balance: 80000, annualContribution: 6000 },
    ],
  },
]

describe('share links', () => {
  it('round-trips a plan through the compressed URL payload', () => {
    const encoded = encodePlan(buildRetirementPlan(assumptions, people))
    const decoded = decodePlan(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!.people[0].name).toBe('Alice')
    expect(decoded!.people[0].oasStartAge).toBe(70)
    expect(decoded!.people[0].accounts[0].balance).toBe(250000)
    expect(decoded!.assumptions.expectedReturn).toBe(7)
  })

  it('builds a share URL with the plan in the fragment', () => {
    const plan = buildRetirementPlan(assumptions, people)
    const url = buildShareUrl(plan, 'https://example.com/retire-eh/')

    expect(url).toMatch(/^https:\/\/example\.com\/retire-eh\/#plan=/)
    const decoded = readSharePlanFromUrl(url)
    expect(decoded).not.toBeNull()
    expect(decoded!.people[0].name).toBe('Alice')
  })

  it('does not put the plan in plain text in the URL', () => {
    const plan = buildRetirementPlan(assumptions, people)
    const url = buildShareUrl(plan, 'https://example.com/retire-eh/')

    expect(url).not.toContain('Alice')
    expect(url).not.toContain('250000')
  })

  it('ignores URLs without a share payload', () => {
    expect(readSharePlanFromUrl('https://example.com/retire-eh/')).toBeNull()
    expect(readSharePlanFromUrl('https://example.com/retire-eh/#plan=garbage')).toBeNull()
  })
})
