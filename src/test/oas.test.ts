import { describe, it, expect } from 'vitest'
import {
  OAS_MAX_START_AGE,
  OAS_MIN_START_AGE,
  clampOasStartAge,
  getOasIncomeAtAge,
  oasAdjustmentFactor,
} from '@/lib/calculations'

const OAS_AT_65 = 9024

describe('calculations: OAS start age', () => {
  it('leaves the age-65 baseline unchanged', () => {
    expect(oasAdjustmentFactor(65)).toBeCloseTo(1, 5)
  })

  it('increases the amount by 36% when starting at 70', () => {
    expect(oasAdjustmentFactor(70)).toBeCloseTo(1.36, 5)
  })

  it('scales smoothly between 65 and 70', () => {
    expect(oasAdjustmentFactor(68)).toBeCloseTo(1.216, 5)
  })

  it('clamps start ages to the OAS range', () => {
    expect(clampOasStartAge(60)).toBe(OAS_MIN_START_AGE)
    expect(clampOasStartAge(75)).toBe(OAS_MAX_START_AGE)
  })

  it('returns no income before the start age', () => {
    expect(getOasIncomeAtAge(OAS_AT_65, 65, 64)).toBe(0)
    expect(getOasIncomeAtAge(OAS_AT_65, 70, 69)).toBe(0)
  })

  it('applies the adjustment at the start age', () => {
    expect(getOasIncomeAtAge(OAS_AT_65, 65, 65)).toBeCloseTo(OAS_AT_65, 5)
    expect(getOasIncomeAtAge(OAS_AT_65, 70, 70)).toBeCloseTo(12272.64, 5)
  })

  it('defaults to starting at 65 when no start age is provided', () => {
    expect(getOasIncomeAtAge(OAS_AT_65, undefined, 64)).toBe(0)
    expect(getOasIncomeAtAge(OAS_AT_65, undefined, 65)).toBe(OAS_AT_65)
  })
})
