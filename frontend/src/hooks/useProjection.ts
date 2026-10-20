import { projectPersonAccounts } from '@/lib/engine'

export function useProjection() {
  return {
    wasmLoaded: true,
    wasmError: null,
    calculateProjection: projectPersonAccounts,
  }
}
