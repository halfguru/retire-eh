import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockProjections = [
  { year: 2026, age: 35, rrsp: 53500, tfsa: 33200, resp: 0, non_registered: 0, total_net_worth: 86700 },
  { year: 2027, age: 36, rrsp: 62245, tfsa: 38814, resp: 0, non_registered: 0, total_net_worth: 101059 },
  { year: 2056, age: 65, rrsp: 407703, tfsa: 316965, resp: 0, non_registered: 0, total_net_worth: 724668 },
]

vi.mock('@/lib/retirement_core.js', () => {
  class MockRetirementCalculator {
    calculate_yearly_projections() { return mockProjections }
    calculate_projection() {
      return {
        current_age: 35, retirement_age: 65, years_to_retirement: 30,
        net_worth_at_retirement: 724668, annual_withdrawal: 28987, pension_equivalent: 0,
      }
    }
    calculate_simple_projection() { return [] }
    calculate_additional_annual_savings() { return 12345 }
  }
  return {
    default: () => Promise.resolve(),
    RetirementCalculator: MockRetirementCalculator,
  }
})

import { initWasm, getCalculator, isWasmLoaded } from '@/lib/wasm-loader'

describe('WASM bridge integration', () => {
  beforeEach(async () => {
    await initWasm()
  })

  it('returns calculator after initialization', () => {
    expect(isWasmLoaded()).toBe(true)
    const calculator = getCalculator()
    expect(calculator).toBeTruthy()
    expect(typeof calculator.calculate_yearly_projections).toBe('function')
  })

  it('returns projection array with snake_case fields', () => {
    const calculator = getCalculator()
    const result = calculator.calculate_yearly_projections(
      { retirement_age: 65, expected_annual_income: 0 },
      { rrsp: 50000, tfsa: 30000, resp: 0, non_registered: 0 },
      { rrsp_annual: 5000, tfsa_annual: 6000, resp_annual: 0, non_registered_annual: 0 },
      { return_rate: 7.0, inflation_rate: 2.5 },
      35,
      2026,
    )

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toBe(3)

    const firstRow = result[0]
    expect(firstRow).toHaveProperty('year')
    expect(firstRow).toHaveProperty('age')
    expect(firstRow).toHaveProperty('rrsp')
    expect(firstRow).toHaveProperty('tfsa')
    expect(firstRow).toHaveProperty('total_net_worth')
  })

  it('maps WASM output to ProjectionDataPoint shape correctly', () => {
    const calculator = getCalculator()
    const wasmResult = calculator.calculate_yearly_projections(
      { retirement_age: 65, expected_annual_income: 0 },
      { rrsp: 50000, tfsa: 30000, resp: 0, non_registered: 0 },
      { rrsp_annual: 5000, tfsa_annual: 6000, resp_annual: 0, non_registered_annual: 0 },
      { return_rate: 7.0, inflation_rate: 2.5 },
      35,
      2026,
    )

    const mapped = wasmResult.map((p: Record<string, number>) => ({
      year: p.year,
      age: p.age,
      RRSP: p.rrsp,
      TFSA: p.tfsa,
      Total: p.total_net_worth,
    }))

    expect(mapped[0]).toEqual({
      year: 2026,
      age: 35,
      RRSP: 53500,
      TFSA: 33200,
      Total: 86700,
    })
  })

  it('projection values grow over time', () => {
    const calculator = getCalculator()
    const result = calculator.calculate_yearly_projections(
      { retirement_age: 65, expected_annual_income: 0 },
      { rrsp: 50000, tfsa: 30000, resp: 0, non_registered: 0 },
      { rrsp_annual: 5000, tfsa_annual: 6000, resp_annual: 0, non_registered_annual: 0 },
      { return_rate: 7.0, inflation_rate: 2.5 },
      35,
      2026,
    )

    expect(result[result.length - 1].total_net_worth).toBeGreaterThan(result[0].total_net_worth)
  })

  it('calculate_projection returns summary object with snake_case fields', () => {
    const calculator = getCalculator()
    const result = calculator.calculate_projection(
      { retirement_age: 65, expected_annual_income: 0 },
      { rrsp: 50000, tfsa: 30000, resp: 0, non_registered: 0 },
      { rrsp_annual: 5000, tfsa_annual: 6000, resp_annual: 0, non_registered_annual: 0 },
      [],
      { return_rate: 7.0, inflation_rate: 2.5 },
      35,
    )

    expect(result).toHaveProperty('current_age')
    expect(result).toHaveProperty('retirement_age')
    expect(result).toHaveProperty('years_to_retirement')
    expect(result).toHaveProperty('net_worth_at_retirement')
    expect(result).toHaveProperty('annual_withdrawal')
  })
})
