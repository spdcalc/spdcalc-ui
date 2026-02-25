import { describe, test, expect, beforeEach } from 'bun:test'
import { cachedPromise, clearCache, hasCache, cacheSize } from './promise-cache'

describe('Promise Cache (Singleton)', () => {
  // Clear cache before each test to ensure isolation
  beforeEach(() => {
    clearCache()
  })

  test('caches promises by key', async () => {
    let callCount = 0
    const factory = () => {
      callCount++
      return Promise.resolve('result')
    }

    const p1 = cachedPromise('key1', factory)
    const p2 = cachedPromise('key1', factory)

    expect(p1).toBe(p2) // Same promise
    expect(callCount).toBe(1) // Factory called once

    await p1
    expect(await p2).toBe('result')
  })

  test('different keys create different promises', async () => {
    const factory = () => Promise.resolve('result')

    const p1 = cachedPromise('key1', factory)
    const p2 = cachedPromise('key2', factory)

    expect(p1).not.toBe(p2) // Different promises
  })

  test('clears cache on rejection', async () => {
    let callCount = 0

    const failingFactory = () => {
      callCount++
      return Promise.reject(new Error('fail'))
    }

    const p1 = cachedPromise('key1', failingFactory)
    await p1.catch(() => {}) // Suppress error

    expect(callCount).toBe(1)
    expect(hasCache('key1')).toBe(false) // Cleaned up after rejection

    // Can retry with same key
    const p2 = cachedPromise('key1', failingFactory)
    await p2.catch(() => {})

    expect(callCount).toBe(2) // Factory called again
  })

  test('clearCache with key removes single cached promise', () => {
    cachedPromise('key1', () => Promise.resolve('result'))

    expect(hasCache('key1')).toBe(true)
    clearCache('key1')
    expect(hasCache('key1')).toBe(false)
  })

  test('clearCache without key removes all cached promises', () => {
    cachedPromise('key1', () => Promise.resolve('result'))
    cachedPromise('key2', () => Promise.resolve('result'))

    expect(cacheSize()).toBe(2)
    clearCache()
    expect(cacheSize()).toBe(0)
  })

  test('hasCache checks if key exists', () => {
    expect(hasCache('key1')).toBe(false)

    cachedPromise('key1', () => Promise.resolve('result'))

    expect(hasCache('key1')).toBe(true)
  })

  test('cacheSize returns number of cached promises', () => {
    expect(cacheSize()).toBe(0)

    cachedPromise('key1', () => Promise.resolve('result'))
    expect(cacheSize()).toBe(1)

    cachedPromise('key2', () => Promise.resolve('result'))
    expect(cacheSize()).toBe(2)

    clearCache('key1')
    expect(cacheSize()).toBe(1)
  })
})
