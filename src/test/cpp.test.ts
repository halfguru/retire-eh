import { describe, it, expect } from 'vitest'
import {
  CPP_MAX_START_AGE,
  CPP_MIN_START_AGE,
  clampCppStartAge,
  cppAdjustmentFactor,
  getCppIncomeAtAge,
} from '@/lib/calculations'

describe('calculations: CPP start age', () => {
  it('leaves the age-65 baseline unchanged', () => {
    expect(cppAdjustmentFactor(65)).toBeCloseTo(1, 5)
  })

  it('reduces the amount by 36% when starting at 60', () => {
    expect(cppAdjustmentFactor(60)).toBeCloseTo(0.64, 5)
  })

  it('increases the amount by 42% when starting at 70', () => {
    expect(cppAdjustmentFactor(70)).toBeCloseTo(1.42, 5)
  })

  it('scales smoothly between 60 and 70', () => {
    expect(cppAdjustmentFactor(63)).toBeCloseTo(0.856, 5)
    expect(cppAdjustmentFactor(68)).toBeCloseTo(1.252, 5)
  })

  it('clamps start ages to the CPP range', () => {
    expect(clampCppStartAge(55)).toBe(CPP_MIN_START_AGE)
    expect(clampCppStartAge(75)).toBe(CPP_MAX_START_AGE)
  })

  it('returns no income before the start age', () => {
    expect(getCppIncomeAtAge(18000, 65, 60)).toBe(0)
    expect(getCppIncomeAtAge(18000, 70, 69)).toBe(0)
  })

  it('applies the adjustment at the start age', () => {
    expect(getCppIncomeAtAge(18000, 60, 60)).toBeCloseTo(11520, 5)
    expect(getCppIncomeAtAge(18000, 70, 70)).toBeCloseTo(25560, 5)
  })

  it('defaults to starting at 65 when no start age is provided', () => {
    expect(getCppIncomeAtAge(18000, undefined, 64)).toBe(0)
    expect(getCppIncomeAtAge(18000, undefined, 65)).toBe(18000)
  })
})
