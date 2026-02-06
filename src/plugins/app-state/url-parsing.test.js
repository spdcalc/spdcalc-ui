import { describe, test, expect } from 'bun:test'
import { getAppStateFromUrl } from './app-state-manager'
import { createTestStore, extractQueryFromHash } from './test-helpers'

export const CASES = [
  {
    hash: '#/?cfg=eyJhdXRvQ2FsY1RoZXRhIjpmYWxzZSzJFlBlcmlvZGljUG9saW5nIjp0cnXLHkludGVncmF0aW9uTGltaXRzyCFzcGRDb25maWciOnsiY3J5c3RhbCI6IkJpQk9fMSIsInBtX3R5cGUiOiJUeXBlMV9lX29vIizIKl905gCMNTDKE3BoaSI6McoQbGVuZ3RoIjozMDDLJnRlbXBlcmF0dXJlxBssImNvdW50ZXJfcHJvcGFn5QCq6ACkZmliZXJfY291cOwA23B1bXBfd2F2ZchhNzY0xxZiYW5kd2lkxXYuMzXJLGlzdCI6MuQAh8URc3BlY3RydW1fdGhyZXNob2xkIjowLjAwMccgcG93ZXIiOjMsInNpZ25hbM1uMTTkAPXHGecBBzLJEeUBBcog6wCRMctO5QCQM%2BQAkMwTX3Bvc2nmAQAtODE2LjgzMjc4MDMzNzI1ODMsImlkbGVy1Co4LjQzMTM4OTY1MjExOTYsInDnAhNfcOUCFF9lbmFibGVk6QFBxhbGJuQA%2BjQ1MDU2NjUzNjI5ODgzODYsImFwb2RpeuUBjdA%2BzBvnAiJCYXJ0bGV0dCLOHmZ3aG0iOjE25ADozBhwYXJhbeUBNc0Wb2lu5AKfW10sImRlZmYiOjM0LCJp5wLAb3LkAqhtZXRo5ACzIkNsZW5zaGF3Q3VydGlzIiwidG9sZXJhbmNl5QHo5QJybWF4X2RlcOUBfMURZGVncmVlIjo0xAxpdnPkAr99fcpkaW9u6gMTbHNfbWlu5AHvMTUuNjcsxRFheMQRODYuMDMsImxpxyI2MTMuNDnGEcUiNjE2LjI15AHdeuYAkH19&panels=W3sidHlwZSI6ImpvaW50LXNwZWN0cnVtIiwic2V0dGluZ3MiOnsiZW5hYmxlTG9nU2NhbGUiOmZhbHNlLCJoaWdobGlnaHRaZXJvyRZheGlzVMZVV2F2ZWxlbmd0aCIsImF1dG9VcGRhdGUiOnRydWV9fSzJfmhlcmFsZGluZy1jYWxjdWxhdG9y7wCE3D9QYW5lbExvYWRlzzZ9fV0%3D',
    panels: [
      {
        "type": "joint-spectrum",
        "settings": {
          "enableLogScale": false,
          "highlightZero": false,
          "axisType": "Wavelength",
          "autoUpdate": true
        }
      },
      {
        "type": "heralding-calculator",
        "settings": {
          "autoUpdate": true
        }
      },
      {
        "type": "PanelLoader",
        "settings": {}
      }
    ],
    cfg: {
      "autoCalcTheta": false,
      "autoCalcPeriodicPoling": true,
      "autoCalcIntegrationLimits": true,
      "spdConfig": {
        "crystal": "BiBO_1",
        "pm_type": "Type1_e_oo",
        "crystal_theta": 50,
        "crystal_phi": 1,
        "crystal_length": 3000,
        "crystal_temperature": 30,
        "counter_propagation": true,
        "fiber_coupling": true,
        "pump_wavelength": 764,
        "pump_bandwidth": 3.35,
        "pump_waist": 200,
        "pump_spectrum_threshold": 0.001,
        "pump_power": 3,
        "signal_wavelength": 1450,
        "signal_theta": 2,
        "signal_phi": 0,
        "signal_bandwidth": 1,
        "signal_waist": 300,
        "signal_waist_position": -816.8327803372583,
        "idler_waist_position": -818.4313896521196,
        "periodic_poling_enabled": true,
        "poling_period": 0.4505665362988386,
        "apodization_enabled": true,
        "apodization_type": "Bartlett",
        "apodization_fwhm": 1600,
        "apodization_param": 2,
        "apodization_points": [],
        "deff": 34,
        "integrator": {
          "method": "ClenshawCurtis",
          "tolerance": 200000,
          "max_depth": 1000,
          "degree": 40,
          "divs": 50
        }
      },
      "integrationConfig": {
        "ls_min": 1415.67,
        "ls_max": 1486.03,
        "li_min": 1613.49,
        "li_max": 1616.25,
        "size": 200
      }
    }
  }
]

describe('URL Hash Parsing', () => {
  test('parses v0 hash format correctly', async () => {
    const { hash, cfg: expectedCfg, panels: expectedPanels } = CASES[0]

    // CASES[0] uses old format: #/?cfg=...&panels=...
    const query = extractQueryFromHash(hash)

    // Verify v0 format structure
    expect(query.cfg).toBeDefined()
    expect(query.panels).toBeDefined()
    expect(query.s).toBeUndefined() // No unified 's' param in v0

    // Use exported function to parse (handles v0 → v1 migration)
    const appState = await getAppStateFromUrl(query)
    expect(appState).toBeTruthy()
    expect(appState.version).toBe(1) // Should be migrated to v1
    expect(appState.data.parameters).toBeDefined() // cfg → parameters
    expect(appState.data.panels).toBeDefined()

    // Verify the data was parsed correctly
    const { parameters, panels } = appState.data

    // Check parameters fields
    expect(parameters.autoCalcTheta).toBe(expectedCfg.autoCalcTheta)
    expect(parameters.autoCalcPeriodicPoling).toBe(expectedCfg.autoCalcPeriodicPoling)
    expect(parameters.autoCalcIntegrationLimits).toBe(expectedCfg.autoCalcIntegrationLimits)

    // Check nested spdConfig
    expect(parameters.spdConfig.crystal).toBe(expectedCfg.spdConfig.crystal)
    expect(parameters.spdConfig.pm_type).toBe(expectedCfg.spdConfig.pm_type)
    expect(parameters.spdConfig.pump_wavelength).toBe(expectedCfg.spdConfig.pump_wavelength)

    // Check integrationConfig
    expect(parameters.integrationConfig).toMatchObject(expectedCfg.integrationConfig)

    // Check panels
    expect(panels.length).toBe(expectedPanels.length)
    expectedPanels.forEach((expectedPanel, i) => {
      expect(panels[i].type).toBe(expectedPanel.type)
      expect(panels[i].settings).toMatchObject(expectedPanel.settings)
    })
  })

  test('handles empty query', async () => {
    const appState = await getAppStateFromUrl({})
    expect(appState).toBeNull()
  })

  test('handles null query', async () => {
    const appState = await getAppStateFromUrl(null)
    expect(appState).toBeNull()
  })

  test('extractQueryFromHash works correctly', () => {
    const hash = '#/?cfg=test&panels=data'
    const query = extractQueryFromHash(hash)

    expect(query.cfg).toBe('test')
    expect(query.panels).toBe('data')
  })

  test('extractQueryFromHash handles empty hash', () => {
    const hash = '#/'
    const query = extractQueryFromHash(hash)

    expect(query).toEqual({})
  })
})

describe('Store Integration', () => {
  test('store initializes with mock worker', async () => {
    const store = createTestStore()

    // Wait for init to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify store has expected modules
    expect(store.state.parameters).toBeDefined()
    expect(store.state.panels).toBeDefined()

    // Verify worker provider is available
    expect(store.$spdWorker).toBeDefined()
    expect(typeof store.$spdWorker.get).toBe('function')
  })

  test('can get mock worker from store', async () => {
    const store = createTestStore()

    // Get worker
    const { worker } = await store.$spdWorker.get('test-integration')

    // Verify mock worker has expected methods
    expect(typeof worker.fetchCrystalMeta).toBe('function')
    expect(typeof worker.getParamsFromJson).toBe('function')
    expect(typeof worker.calculateCrystalTheta).toBe('function')

    // Test mock worker method
    const theta = await worker.calculateCrystalTheta({})
    expect(theta).toBe(45)
  })

  test('loads v0 hash into store (complete flow)', async () => {
    const store = createTestStore()
    const { hash, cfg: expectedCfg, panels: expectedPanels } = CASES[0]

    // Parse hash
    const query = extractQueryFromHash(hash)

    // Verify v0 format
    expect(query.cfg).toBeDefined()
    expect(query.panels).toBeDefined()

    // Parse state (handles v0 → v1 migration)
    const appState = await getAppStateFromUrl(query)
    expect(appState.version).toBe(1)

    // Load into store
    await store.dispatch('parameters/loadState', appState.data.parameters)
    await store.dispatch('panels/loadState', appState.data.panels)

    // Verify parameters loaded correctly
    const { parameters } = store.state
    expect(parameters.autoCalcTheta).toBe(expectedCfg.autoCalcTheta)
    expect(parameters.spdConfig).toMatchObject(expectedCfg.spdConfig)
    expect(parameters.integrationConfig).toMatchObject(expectedCfg.integrationConfig)

    // Verify panels loaded correctly
    const { panels } = store.state.panels
    expect(panels.length).toBe(expectedPanels.length)
    expectedPanels.forEach((expectedPanel, i) => {
      expect(panels[i].type).toBe(expectedPanel.type)
      expect(panels[i].settings).toMatchObject(expectedPanel.settings)
    })
  })
})
