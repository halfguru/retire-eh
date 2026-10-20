import { describe, it, expect } from 'vitest'

describe('setup', () => {
  it('has crypto.randomUUID available', () => {
    expect(typeof crypto.randomUUID).toBe('function')
    const id = crypto.randomUUID()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })
})
