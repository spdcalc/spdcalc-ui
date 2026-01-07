import { describe, test, expect } from 'bun:test'
import { applyMigrations, CURRENT_VERSION, migrations, parseAppState, createAppState } from './migrations'

describe('App State Migrations', () => {
  test('CURRENT_VERSION is 1', () => {
    expect(CURRENT_VERSION).toBe(1)
  })

  test('migrateV0 handles unversioned data', () => {
    const v0State = {
      version: 0,
      data: {
        autoCalcTheta: true,
        spdConfig: { crystal: 'KTP' }
      }
    }
    const result = migrations.migrateV0(v0State)

    expect(result.version).toBe(0)
    expect(result.data).toEqual(v0State.data)
  })

  test('applyMigrations returns current version', () => {
    const testState = {
      version: 0,
      data: {
        autoCalcTheta: true,
        spdConfig: { crystal: 'KTP' }
      }
    }
    const result = applyMigrations(testState)

    expect(result.version).toBeDefined()
    expect(result.data).toBeDefined()
  })
})

describe('parseAppState', () => {
  test('handles versioned data (v1 format)', () => {
    const versioned = {
      v: 1,
      d: {
        autoCalcTheta: true,
        spdConfig: { crystal: 'BBO' }
      }
    }
    const result = parseAppState(versioned)

    expect(result.version).toBeDefined()
    expect(result.data.autoCalcTheta).toBe(true)
    expect(result.data.spdConfig.crystal).toBe('BBO')
  })

  test('handles unversioned (v0) data', () => {
    const unversioned = {
      autoCalcTheta: false,
      spdConfig: { crystal: 'KTP' }
    }
    const result = parseAppState(unversioned)

    expect(result.version).toBeDefined()
    expect(result.data).toBeDefined()
    expect(result.data.autoCalcTheta).toBe(false)
  })

  test('handles null/undefined gracefully', () => {
    const result1 = parseAppState(null)
    expect(result1).toBeDefined()

    const result2 = parseAppState(undefined)
    expect(result2).toBeDefined()
  })
})

describe('createAppState', () => {
  test('wraps data with current version', () => {
    const data = {
      autoCalcTheta: true,
      spdConfig: { crystal: 'KTP', pump_wavelength: 405 }
    }
    const result = createAppState(data)

    expect(result.v).toBe(CURRENT_VERSION)
    expect(result.d).toEqual(data)
  })

  test('creates correct structure', () => {
    const data = { test: 'value' }
    const result = createAppState(data)

    expect(result).toHaveProperty('v')
    expect(result).toHaveProperty('d')
    expect(Object.keys(result).length).toBe(2)
  })
})

describe('round-trip compatibility', () => {
  test('create → parse preserves data', () => {
    const original = {
      autoCalcTheta: true,
      autoCalcPeriodicPoling: false,
      spdConfig: {
        crystal: 'KTP',
        pump_wavelength: 405,
        crystal_theta: 90
      }
    }

    const created = createAppState(original)
    const parsed = parseAppState(created)

    expect(parsed.data).toEqual(original)
  })

  test('handles complex nested data', () => {
    const complex = {
      autoCalcTheta: true,
      spdConfig: {
        crystal: 'BBO',
        apodization: {
          points: [1, 2, 3, 4, 5],
          type: 'Gaussian'
        }
      },
      integrationConfig: {
        method: 'Simpson',
        tolerance: 1e-6
      }
    }

    const created = createAppState(complex)
    const parsed = parseAppState(created)

    expect(parsed.data).toEqual(complex)
  })
})
