import { describe, it, expect } from 'vitest'
import { validateYamlImport, validateAge, validateRetirementAge } from '@/lib/validation'

describe('validateAge', () => {
  it('returns null for valid ages', () => {
    expect(validateAge(0)).toBeNull()
    expect(validateAge(35)).toBeNull()
    expect(validateAge(120)).toBeNull()
  })

  it('returns error for negative ages', () => {
    expect(validateAge(-1)).toBe('Age must be 0 or greater')
  })

  it('returns error for ages over 120', () => {
    expect(validateAge(121)).toBe('Age must be 120 or less')
  })

  it('returns error for non-integer ages', () => {
    expect(validateAge(35.5)).toBe('Age must be a whole number')
  })

  it('returns error for NaN', () => {
    expect(validateAge(NaN)).toBe('Age must be 0 or greater')
  })
})

describe('validateRetirementAge', () => {
  it('returns null for valid retirement ages', () => {
    expect(validateRetirementAge(65, 35)).toBeNull()
    expect(validateRetirementAge(66, 35)).toBeNull()
  })

  it('returns error when retirement age <= current age', () => {
    expect(validateRetirementAge(35, 35)).toBe('Must be greater than current age')
    expect(validateRetirementAge(34, 35)).toBe('Must be greater than current age')
  })

  it('returns error for invalid values', () => {
    expect(validateRetirementAge(-1, 35)).toBe('Age must be 0 or greater')
    expect(validateRetirementAge(121, 35)).toBe('Age must be 120 or less')
    expect(validateRetirementAge(65.5, 35)).toBe('Age must be a whole number')
  })
})

describe('validateYamlImport', () => {
  const validPlan = {
    version: '1.0',
    assumptions: {
      expectedReturn: 7,
      inflationRate: 2.5,
      replacementRate: 70,
      withdrawalRate: 4,
      showRealValues: true,
    },
    people: [{
      id: '1',
      name: 'Alice',
      currentAge: 35,
      retirementAge: 65,
      annualIncome: 100000,
      annualPension: 0,
      accounts: [
        { id: 'a1', type: 'RRSP', balance: 50000, annualContribution: 5000 },
      ],
    }],
  }

  it('succeeds for valid data', () => {
    const result = validateYamlImport(validPlan)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.people[0].name).toBe('Alice')
    }
  })

  it('fails for missing assumptions', () => {
    const result = validateYamlImport({
      version: '1.0',
      people: validPlan.people,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('fails for missing people', () => {
    const result = validateYamlImport({
      version: '1.0',
      assumptions: validPlan.assumptions,
      people: [],
    })
    expect(result.success).toBe(false)
  })

  it('fails for invalid account type', () => {
    const result = validateYamlImport({
      ...validPlan,
      people: [{
        ...validPlan.people[0],
        accounts: [{ id: 'a1', type: 'INVALID', balance: 0, annualContribution: 0 }],
      }],
    })
    expect(result.success).toBe(false)
  })

  it('fails for negative balance', () => {
    const result = validateYamlImport({
      ...validPlan,
      people: [{
        ...validPlan.people[0],
        accounts: [{ id: 'a1', type: 'RRSP', balance: -100, annualContribution: 0 }],
      }],
    })
    expect(result.success).toBe(false)
  })

  it('fails for retirement age <= current age', () => {
    const result = validateYamlImport({
      ...validPlan,
      people: [{
        ...validPlan.people[0],
        retirementAge: 30,
      }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0]).toContain('retirement age')
    }
  })

  it('fails for zero withdrawal rate', () => {
    const result = validateYamlImport({
      ...validPlan,
      assumptions: { ...validPlan.assumptions, withdrawalRate: 0 },
    })
    expect(result.success).toBe(false)
  })

  it('fails for non-numeric values', () => {
    const result = validateYamlImport({
      ...validPlan,
      assumptions: { ...validPlan.assumptions, expectedReturn: 'not-a-number' },
    })
    expect(result.success).toBe(false)
  })
})
