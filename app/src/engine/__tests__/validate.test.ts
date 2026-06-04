import { describe, it, expect } from 'vitest'
import { sanitizeInputs, migratePersistedState } from '../validate'
import { DEFAULT_INPUTS } from '../defaults'
import { runProjection } from '../model'

describe('sanitizeInputs', () => {
  it('returns full defaults for null/undefined/non-object', () => {
    expect(sanitizeInputs(null)).toEqual(DEFAULT_INPUTS)
    expect(sanitizeInputs(undefined)).toEqual(DEFAULT_INPUTS)
    expect(sanitizeInputs(42)).toEqual(DEFAULT_INPUTS)
    expect(sanitizeInputs('hello')).toEqual(DEFAULT_INPUTS)
  })

  it('fills missing fields from defaults', () => {
    const sanitized = sanitizeInputs({ currentAge: 30, salary: 80000 })
    expect(sanitized.currentAge).toBe(30)
    expect(sanitized.salary).toBe(80000)
    expect(sanitized.retirementAge).toBe(DEFAULT_INPUTS.retirementAge)
    expect(sanitized.inflation).toBe(DEFAULT_INPUTS.inflation)
  })

  it('rejects NaN and Infinity, falling back to defaults', () => {
    const sanitized = sanitizeInputs({
      currentAge: NaN,
      salary: Infinity,
      stocks: -Infinity,
    })
    expect(sanitized.currentAge).toBe(DEFAULT_INPUTS.currentAge)
    expect(sanitized.salary).toBe(DEFAULT_INPUTS.salary)
    expect(sanitized.stocks).toBe(DEFAULT_INPUTS.stocks)
  })

  it('rejects wrong types (string-as-number, etc.)', () => {
    const sanitized = sanitizeInputs({
      currentAge: '30',
      salary: { evil: 'object' },
      backdoorRoth: 'yes',
      filingStatus: 'divorced',
    })
    expect(sanitized.currentAge).toBe(DEFAULT_INPUTS.currentAge)
    expect(sanitized.salary).toBe(DEFAULT_INPUTS.salary)
    expect(sanitized.backdoorRoth).toBe(DEFAULT_INPUTS.backdoorRoth)
    expect(sanitized.filingStatus).toBe(DEFAULT_INPUTS.filingStatus)
  })

  it('drops malformed array entries but keeps valid ones', () => {
    const sanitized = sanitizeInputs({
      milestones: [
        { id: 'a', age: 30, label: 'OK', cost: 50000, enabled: true },
        null,
        { age: 'not-a-number' }, // dropped
        { id: 'b', age: 40, cost: 20000 }, // missing label/enabled - filled
      ],
    })
    expect(sanitized.milestones).toHaveLength(2)
    expect(sanitized.milestones[0].id).toBe('a')
    expect(sanitized.milestones[1].id).toBe('b')
    expect(sanitized.milestones[1].enabled).toBe(true)
  })

  it('produces an output that runProjection can consume without throwing', () => {
    const garbage = {
      inputs: 'corrupted',
      milestones: 'not an array',
      debts: [{ bogus: true }, 42, null],
      currentAge: 'twenty-eight',
    }
    const sanitized = sanitizeInputs(garbage)
    expect(() => runProjection(sanitized)).not.toThrow()
  })

  it('passes through valid DEFAULT_INPUTS unchanged', () => {
    expect(sanitizeInputs(DEFAULT_INPUTS)).toEqual(DEFAULT_INPUTS)
  })
})

describe('migratePersistedState', () => {
  it('returns non-object input as-is', () => {
    expect(migratePersistedState(null, 0)).toBe(null)
    expect(migratePersistedState(undefined, 0)).toBe(undefined)
  })

  it('sanitizes the inputs field on migration', () => {
    const persisted = {
      inputs: { currentAge: 'bad', salary: 100000 },
      scenarios: [],
    }
    const migrated = migratePersistedState(persisted, 0) as { inputs: { currentAge: number; salary: number } }
    expect(migrated.inputs.currentAge).toBe(DEFAULT_INPUTS.currentAge)
    expect(migrated.inputs.salary).toBe(100000)
  })

  it('preserves non-input fields', () => {
    const persisted = {
      inputs: DEFAULT_INPUTS,
      scenarios: [{ id: '1', name: 'test' }],
      mode: 'advanced',
    }
    const migrated = migratePersistedState(persisted, 0) as Record<string, unknown>
    expect(migrated.scenarios).toEqual([{ id: '1', name: 'test' }])
    expect(migrated.mode).toBe('advanced')
  })
})
