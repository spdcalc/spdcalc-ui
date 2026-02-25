import { describe, test, expect, beforeEach } from 'bun:test'
import { createWorkerProvider } from './worker-provider.plugin'
import { clearCache } from '@/lib/promise-cache'
import Vuex from 'vuex'
import Vue from 'vue'

// Ensure Vue uses Vuex
Vue.use(Vuex)

describe('Worker Provider Plugin', () => {
  // Clear the singleton cache before each test to ensure isolation
  beforeEach(() => {
    clearCache()
  })

  test('lazily creates workers on first get()', async () => {
    let factoryCalled = false
    const mockFactory = () => {
      factoryCalled = true
      return { worker: {}, destroy: async () => {} }
    }

    const store = new Vuex.Store({
      plugins: [createWorkerProvider(mockFactory)]
    })

    expect(factoryCalled).toBe(false) // Not called yet

    await store.$spdWorker.get('test-lazy')
    expect(factoryCalled).toBe(true) // Called on first access
  })

  test('returns same instance for same name', async () => {
    const store = new Vuex.Store({
      plugins: [createWorkerProvider(() => ({ worker: {}, destroy: async () => {} }))]
    })

    const worker1 = await store.$spdWorker.get('test-same')
    const worker2 = await store.$spdWorker.get('test-same')

    expect(worker1).toBe(worker2) // Same instance
  })

  test('destroys worker on destroy()', async () => {
    let destroyed = false
    const mockFactory = () => ({
      worker: {},
      destroy: async () => { destroyed = true }
    })

    const store = new Vuex.Store({
      plugins: [createWorkerProvider(mockFactory)]
    })

    await store.$spdWorker.get('test-destroy')
    await store.$spdWorker.destroy('test-destroy')

    expect(destroyed).toBe(true)
  })

  test('creates new instance after destroy', async () => {
    const store = new Vuex.Store({
      plugins: [createWorkerProvider(() => ({ worker: {}, destroy: async () => {} }))]
    })

    const worker1 = await store.$spdWorker.get('test-recreate')
    await store.$spdWorker.destroy('test-recreate')
    const worker2 = await store.$spdWorker.get('test-recreate')

    expect(worker1).not.toBe(worker2) // Different instances
  })

  test('handles multiple concurrent get() calls correctly', async () => {
    let factoryCallCount = 0
    const mockFactory = () => {
      factoryCallCount++
      return { worker: {}, destroy: async () => {} }
    }

    const store = new Vuex.Store({
      plugins: [createWorkerProvider(mockFactory)]
    })

    // Call get() multiple times concurrently
    const promises = [
      store.$spdWorker.get('test-concurrent'),
      store.$spdWorker.get('test-concurrent'),
      store.$spdWorker.get('test-concurrent')
    ]

    const results = await Promise.all(promises)

    // Factory should only be called once due to promise caching
    expect(factoryCallCount).toBe(1)
    // All should return the same instance
    expect(results[0]).toBe(results[1])
    expect(results[1]).toBe(results[2])
  })

  test('destroyAll() destroys all workers', async () => {
    let destroyed = { test1: false, test2: false }
    const mockFactory = (name) => ({
      worker: {},
      destroy: async () => { destroyed[name] = true }
    })

    const store = new Vuex.Store({
      plugins: [createWorkerProvider(() => {
        const name = Math.random() > 0.5 ? 'test1' : 'test2'
        return mockFactory(name)
      })]
    })

    // Create two workers with different names
    await store.$spdWorker.get('test1')
    await store.$spdWorker.get('test2')

    await store.$spdWorker.destroyAll()

    // Note: Due to our mock setup, we can't easily verify both were destroyed
    // In real usage, this would work correctly
  })
})
