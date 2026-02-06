import Vuex from 'vuex'
import Vue from 'vue'
import { parameters } from '../../store/parameters'
import { panels } from '../../store/panels/index'
import { createWorkerProvider } from '../../store/worker-provider.plugin'

// Ensure Vue uses Vuex
Vue.use(Vuex)

/**
 * Extract query object from hash URL
 * @param {string} hash - Hash URL (e.g., '#/?cfg=...&panels=...' or '#/?s=...')
 * @returns {object} Query object (e.g., { cfg: '...', panels: '...' } or { s: '...' })
 */
export function extractQueryFromHash(hash) {
  const hashContent = hash.split('#/')[1]
  if (!hashContent) return {}
  return Object.fromEntries(new URLSearchParams(hashContent))
}

// Mock worker factory for tests
const createMockWorker = () => ({
  worker: {
    // Mock worker methods (add as needed for tests)
    fetchCrystalMeta: async () => [],
    getParamsFromJson: async (json) => JSON.parse(json),
    calculateCrystalTheta: async () => 45,
    calculatePeriodicPoling: async () => 0,
    getWaistPositions: async () => [0, 0],
    getRefractiveIndices: async () => [1, 1, 1],
    getOptimumIdler: async () => 810,
    calculateJSIRanges: async () => ({
      ls_min: 700,
      ls_max: 900,
      li_min: 700,
      li_max: 900
    })
  },
  destroy: async () => {}
})

/**
 * Factory for test store instances with mock workers
 * @returns {Vuex.Store} Store instance with parameters and panels modules
 */
export function createTestStore() {
  const workerProvider = createWorkerProvider(createMockWorker)
  const prefetcher = store => store.dispatch('parameters/init')

  return new Vuex.Store({
    plugins: [
      workerProvider,  // Inject mock worker
      prefetcher       // Can now run without real worker
    ],
    modules: { parameters, panels }
  })
}
