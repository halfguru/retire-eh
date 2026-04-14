import { describe, it, expect } from 'vitest'
import { exportToYAML, importFromYAML } from '@/lib/yaml-utils'
import type { Person } from '@/types/household'
import type { PlanAssumptions } from '@/types/household'

const mockAssumptions: PlanAssumptions = {
  expectedReturn: 7,
  inflationRate: 2.5,
  replacementRate: 70,
  withdrawalRate: 4,
  showRealValues: true,
}

const mockPeople: Person[] = [
  {
    id: 'test-1',
    name: 'Alice',
    currentAge: 35,
    retirementAge: 65,
    annualIncome: 100000,
    annualPension: 0,
    accounts: [
      { id: 'acc-1', type: 'RRSP', balance: 50000, annualContribution: 5000 },
      { id: 'acc-2', type: 'TFSA', balance: 30000, annualContribution: 6000 },
    ],
  },
]

describe('yaml-utils', () => {
  describe('exportToYAML', () => {
    it('exports a valid YAML string', () => {
      const result = exportToYAML(mockAssumptions, mockPeople)
      expect(result).toContain('version:')
      expect(result).toContain('assumptions:')
      expect(result).toContain('people:')
      expect(result).toContain('Alice')
      expect(result).toContain('RRSP')
    })

    it('includes all assumptions', () => {
      const result = exportToYAML(mockAssumptions, mockPeople)
      expect(result).toContain('expectedReturn: 7')
      expect(result).toContain('inflationRate: 2.5')
      expect(result).toContain('replacementRate: 70')
      expect(result).toContain('withdrawalRate: 4')
      expect(result).toContain('showRealValues: true')
    })

    it('includes all account data', () => {
      const result = exportToYAML(mockAssumptions, mockPeople)
      expect(result).toContain('balance: 50000')
      expect(result).toContain('annualContribution: 5000')
      expect(result).toContain('balance: 30000')
      expect(result).toContain('annualContribution: 6000')
    })
  })

  describe('importFromYAML', () => {
    it('round-trips export to import', () => {
      const exported = exportToYAML(mockAssumptions, mockPeople)
      const imported = importFromYAML(exported)
      expect(imported).not.toBeNull()
      expect(imported!.version).toBe('1.0')
      expect(imported!.assumptions.expectedReturn).toBe(7)
      expect(imported!.people).toHaveLength(1)
      expect(imported!.people[0].name).toBe('Alice')
      expect(imported!.people[0].accounts).toHaveLength(2)
    })

    it('returns null for empty string', () => {
      expect(importFromYAML('')).toBeNull()
    })

    it('returns null for invalid YAML', () => {
      expect(importFromYAML(':\n  : invalid')).toBeNull()
    })

    it('returns null for YAML missing assumptions', () => {
      const yaml = 'version: "1.0"\npeople: []\n'
      expect(importFromYAML(yaml)).toBeNull()
    })

    it('returns null for YAML missing people', () => {
      const yaml = 'version: "1.0"\nassumptions:\n  expectedReturn: 7\n'
      expect(importFromYAML(yaml)).toBeNull()
    })

    it('handles special characters in names', () => {
      const people: Person[] = [{
        id: '1',
        name: 'Renée & Pierre',
        currentAge: 30,
        retirementAge: 65,
        annualIncome: 0,
        annualPension: 0,
        accounts: [],
      }]
      const exported = exportToYAML(mockAssumptions, people)
      const imported = importFromYAML(exported)
      expect(imported!.people[0].name).toBe('Renée & Pierre')
    })
  })
})
