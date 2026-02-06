import { cachedPromise, clearCache } from '@/lib/promise-cache'

/**
 * Vuex plugin that provides lazy-loaded web workers
 * Allows dependency injection for testing
 */
export const createWorkerProvider = (workerFactory = null) => {
  // Map of worker instances by name
  const workers = {}

  return (store) => {
    // Inject worker API into store
    store.$spdWorker = {
      /**
       * Get or create a worker instance (promise-cached)
       * @param {string} name - Worker identifier (default: 'default')
       * @returns {Promise<{worker, destroy}>} Worker API
       */
      get(name = 'default') {
        // Use cachedPromise with a prefixed key to avoid collisions
        return cachedPromise(`worker:${name}`, async () => {
          if (!workers[name]) {
            // Lazy load worker factory only when needed
            const factory = workerFactory || (await import('@/workers/spdcalc')).default
            workers[name] = factory()
          }
          return workers[name]
        })
      },

      /**
       * Destroy a worker instance
       * @param {string} name - Worker identifier
       */
      async destroy(name = 'default') {
        if (workers[name]) {
          if (workers[name].destroy) {
            await workers[name].destroy()
          }
          delete workers[name]
        }
        // Clear promise cache so next get() creates new worker
        clearCache(`worker:${name}`)
      },

      /**
       * Destroy all worker instances
       */
      async destroyAll() {
        for (const name of Object.keys(workers)) {
          await store.$spdWorker.destroy(name)
        }
      }
    }
  }
}

// Default export for production use
export default createWorkerProvider()
