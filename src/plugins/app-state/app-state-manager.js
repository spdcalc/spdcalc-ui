import { createAppState, parseAppState } from './migrations'
import { fromHashString, toHashableString } from '@/lib/url-hash-utils'

const QUERY_KEY = 's'

/**
 * Parse app state from URL query parameters
 * @param {object} query - URL query parameters object (e.g., { s: '...', cfg: '...', panels: '...' })
 * @returns {Promise<object|null>} Parsed app state { version, data } or null if no state in URL
 */
export async function getAppStateFromUrl(query) {
  if (!query) return null

  if (query[QUERY_KEY]) {
    // new style (v1+): ?s=BASE64_ENCODED_STATE
    const raw = query[QUERY_KEY]
    return fromHashString(raw)
      .then(rawData => parseAppState(rawData))
  } else if (query['cfg']) {
    // old style (v0): ?cfg=BASE64_CFG&panels=BASE64_PANELS
    const cfg = await fromHashString(query['cfg'])
    const panels = await fromHashString(query['panels'])
    return parseAppState({ version: 0, data: { cfg, panels } })
  } else {
    return null
  }
}

// Refactoring the url state manager. i don't like it
export default function createAppStateManager(store, router, config = {}) {
  const STORES = {
    parameters: 'parameters/hashableObject',
    panels: 'panels/hashableObject',
  }
  let urlLock = false
  let stateLock = false

  const computeHash = async () => {
    const data = {}
    for (const [moduleName, getterPath] of Object.entries(STORES)) {
      data[moduleName] = store.getters[getterPath]
    }
    const appState = createAppState(data)
    const hashString = await toHashableString(appState)
    return hashString
  }

  const updateURLState = async () => {
    if (urlLock) {
      return
    }
    const query = router.currentRoute.query || {}
    const hashString = await computeHash()
    const currentHash = query[QUERY_KEY]
    if (currentHash === hashString) {
      return
    }
    stateLock = true
    // remove old query parameters
    delete query['cfg']
    delete query['panels']
    await router.push({ query: { ...query, s: hashString } })
    stateLock = false
  }

  // route guard to load from URL
  const loadFromURLState = async (to, from, next) => {
    if (stateLock) {
      return next()
    }
    try {
      const query = to.query
      if (!query) {
        // no state in URL
        return next()
      }
      const storeHash = await computeHash()
      if (query[QUERY_KEY] === storeHash) {
        // already in sync
        return next()
      }
      const state = await getAppStateFromUrl(to.query)
      if (!state) {
        return next()
      }
      const { data } = state
      urlLock = true
      for (const [moduleName, moduleData] of Object.entries(data)) {
        if (moduleData) {
          await store.dispatch(`${moduleName}/loadState`, moduleData)
        }
      }
    } catch (e) {
      console.error(e)
    }
    urlLock = false
    return next()
  }

  // watchers to sync store changes to URL
  for (const [moduleName, getterPath] of Object.entries(STORES)) {
    store.watch(
      (state, getters) => getters[getterPath],
      (obj) => updateURLState(),
      { immediate: false, deep: true }
    )
  }

  // router guard
  router.beforeEach((to, from, next) => {
    loadFromURLState(to, from, next)
  })

  // little fix so that autocomputed properties don't interfere with
  // loading from hash
  router.onReady(() => {
    store.commit('parameters/editing', false)
  })
}
