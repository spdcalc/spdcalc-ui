import { describe, test, expect } from 'bun:test'
import { applyMigrations, parseAppState, createAppState, CURRENT_VERSION } from './migrations'

describe('Migration Logic', () => {
  test('migrateV0 converts legacy cfg → parameters', () => {
    const v0State = {
      version: 0,
      data: { cfg: { autoCalcTheta: true }, panels: [] }
    }

    const migrated = applyMigrations(v0State)

    expect(migrated.version).toBe(1)
    expect(migrated.data.parameters).toBeDefined()
    expect(migrated.data.cfg).toBeUndefined() // Should not exist anymore
    expect(migrated.data.parameters.autoCalcTheta).toBe(true)
  })

  test('parseAppState detects and migrates v0 format', () => {
    const v0RawData = {
      version: 0,
      data: {
        cfg: { autoCalcTheta: false, spdConfig: { crystal: 'BiBO_1' } },
        panels: [{ type: 'joint-spectrum', settings: {} }]
      }
    }

    const result = parseAppState(v0RawData)

    expect(result.version).toBe(1)
    expect(result.data.parameters).toBeDefined()
    expect(result.data.parameters.autoCalcTheta).toBe(false)
    expect(result.data.parameters.spdConfig.crystal).toBe('BiBO_1')
    expect(result.data.panels).toEqual(v0RawData.data.panels)
  })

  test('parseAppState passes through v1 format unchanged', () => {
    const v1RawData = {
      version: 1,
      data: {
        parameters: { autoCalcTheta: true },
        panels: []
      }
    }

    const result = parseAppState(v1RawData)

    expect(result.version).toBe(1)
    expect(result.data).toEqual(v1RawData.data)
  })

  test('createAppState wraps data with current version', () => {
    const data = { parameters: {}, panels: [] }

    const appState = createAppState(data)

    expect(appState.version).toBe(CURRENT_VERSION)
    expect(appState.data).toBe(data)
  })
})
