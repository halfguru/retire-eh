import init, { RetirementCalculator } from './retirement_core.js'
import type { RetirementCalculator as RetirementCalculatorType } from './retirement_core.d.ts'

let wasmInitialized = false
let wasmError: string | null = null
let calculator: RetirementCalculatorType | null = null

export async function initWasm() {
  if (wasmInitialized) {
    return calculator
  }

  if (wasmError) {
    throw new Error(wasmError)
  }

  try {
    await init('/wasm/retirement_core_bg.wasm')
    calculator = new RetirementCalculator()
    wasmInitialized = true
    return calculator
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load calculation engine'
    wasmError = message
    console.error('WASM initialization failed:', error)
    throw new Error(message)
  }
}

export function isWasmLoaded(): boolean {
  return wasmInitialized
}

export function getWasmError(): string | null {
  return wasmError
}

export function getCalculator(): RetirementCalculatorType {
  if (!wasmInitialized || !calculator) {
    throw new Error('WASM not initialized. Call initWasm() first.')
  }
  return calculator
}
