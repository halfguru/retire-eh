import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('wasm-loader', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws when getCalculator is called before init', async () => {
    const { getCalculator } = await import('@/lib/wasm-loader')
    expect(() => getCalculator()).toThrow('WASM not initialized')
  })

  it('isWasmLoaded returns false before init', async () => {
    const { isWasmLoaded } = await import('@/lib/wasm-loader')
    expect(isWasmLoaded()).toBe(false)
  })

  it('getWasmError returns null before any init attempt', async () => {
    const { getWasmError } = await import('@/lib/wasm-loader')
    expect(getWasmError()).toBeNull()
  })

  it('reports error when WASM fails to load', async () => {
    vi.doMock('@/lib/retirement_core.js', () => {
      return {
        default: () => Promise.reject(new Error('WASM file not found')),
        RetirementCalculator: class {},
      }
    })

    const { initWasm, getWasmError, isWasmLoaded } = await import('@/lib/wasm-loader')
    await expect(initWasm()).rejects.toThrow('WASM file not found')
    expect(isWasmLoaded()).toBe(false)
    expect(getWasmError()).toBe('WASM file not found')
  })
})
