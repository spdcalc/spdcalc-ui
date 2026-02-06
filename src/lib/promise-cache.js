/**
 * Singleton cache for async operations - ensures each operation runs only once
 * even if called multiple times before completion
 *
 * @example
 * // Multiple calls return same promise
 * const p1 = cachedPromise('my-key', () => expensiveAsync())
 * const p2 = cachedPromise('my-key', () => expensiveAsync())
 * p1 === p2 // true, factory only called once
 */

// Singleton cache
const cache = new Map()

/**
 * Get or create a cached promise
 * @param {string} key - Cache key
 * @param {Function} factory - Async factory function (only called if not cached)
 * @returns {Promise} Cached or new promise
 */
export const cachedPromise = (key, factory) => {
  if (!cache.has(key)) {
    const promise = Promise.resolve(factory())
    cache.set(key, promise)

    // Clean up on rejection to allow retry
    promise.catch(() => cache.delete(key))
  }
  return cache.get(key)
}

/**
 * Clear cached promise(s)
 * @param {string} [key] - Optional cache key. If omitted, clears all cache.
 * @returns {boolean|undefined} True if key existed and was deleted, undefined if clearing all
 */
export const clearCache = (key) => {
  if (key !== undefined) {
    return cache.delete(key)
  }
  cache.clear()
}

/**
 * Check if key is cached
 * @param {string} key - Cache key
 * @returns {boolean}
 */
export const hasCache = (key) => {
  return cache.has(key)
}

/**
 * Get number of cached promises
 * @returns {number}
 */
export const cacheSize = () => {
  return cache.size
}
