import { useState, useRef, useEffect } from 'react'
import { initWasm, getCalculator } from '@/lib/wasm-loader'
import type { Account } from '@/types/household'
import type { ProjectionDataPoint } from '@/types/household'

export function useProjection() {
  const [wasmLoaded, setWasmLoaded] = useState(false)
  const [wasmError, setWasmError] = useState<string | null>(null)
  const wasmInitialized = useRef(false)

  useEffect(() => {
    if (wasmInitialized.current) return
    wasmInitialized.current = true

    initWasm()
      .then(() => {
        setWasmLoaded(true)
      })
      .catch((error) => {
        setWasmError(error instanceof Error ? error.message : 'Failed to load calculation engine')
      })
  }, [])

  const calculateProjection = (
    accounts: Account[],
    retirementAge: number,
    baseAge: number,
    expectedReturn: number,
    inflationRate: number,
    showRealValues: boolean,
    yearsToRetirement: number
  ): ProjectionDataPoint[] => {
    if (yearsToRetirement <= 0 || !wasmLoaded) return []

    try {
      const calculator = getCalculator()

      const totalRRSP = accounts.filter(a => a.type === 'RRSP').reduce((sum, acc) => sum + (acc.balance || 0), 0)
      const totalTFSA = accounts.filter(a => a.type === 'TFSA').reduce((sum, acc) => sum + (acc.balance || 0), 0)
      const totalRRSPContribution = accounts.filter(a => a.type === 'RRSP').reduce((sum, acc) => sum + (acc.annualContribution || 0), 0)
      const totalTFSAContribution = accounts.filter(a => a.type === 'TFSA').reduce((sum, acc) => sum + (acc.annualContribution || 0), 0)

      const householdConfig = {
        retirement_age: retirementAge,
        expected_annual_income: 0
      }
      const accountBalance = {
        rrsp: totalRRSP,
        tfsa: totalTFSA,
        resp: 0,
        non_registered: 0
      }
      const contributions = {
        rrsp_annual: totalRRSPContribution,
        tfsa_annual: totalTFSAContribution,
        resp_annual: 0,
        non_registered_annual: 0
      }

      const assumptions = {
        return_rate: expectedReturn,
        inflation_rate: inflationRate
      }

      const result = calculator.calculate_yearly_projections(
        householdConfig,
        accountBalance,
        contributions,
        assumptions,
        baseAge,
        new Date().getFullYear()
      )

      return result.map((p: { year: number; age: number; rrsp: number; tfsa: number; resp: number; non_registered: number; total_net_worth: number }) => {
        const yearsFromNow = p.age - baseAge
        const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromNow)

        const rrspNominal = totalRRSP > 0 || totalRRSPContribution > 0 ? p.rrsp : undefined
        const tfsaNominal = totalTFSA > 0 || totalTFSAContribution > 0 ? p.tfsa : undefined

        const rrspReal = rrspNominal ? rrspNominal / inflationFactor : undefined
        const tfsaReal = tfsaNominal ? tfsaNominal / inflationFactor : undefined
        const totalNominal = p.total_net_worth
        const totalReal = totalNominal / inflationFactor

        return {
          year: p.year,
          age: p.age,
          RRSP: showRealValues ? rrspReal : rrspNominal,
          TFSA: showRealValues ? tfsaReal : tfsaNominal,
          Total: showRealValues ? totalReal : totalNominal,
        }
      })
    } catch (error) {
      console.error('Error calculating projection:', error)
      return []
    }
  }

  return {
    wasmLoaded,
    wasmError,
    calculateProjection
  }
}
