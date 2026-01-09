import { createAppState, parseAppState } from './migrations'
import { fromHashString, toHashableString } from '@/lib/url-hash-utils'

// Refactoring the url state manager. i don't like it
export default function createAppStateManager(store, router, config = {}) {
  const STORES = {
    parameters: 'parameters/hashableObject',
    panels: 'panels/hashableObject',
  }
  const QUERY_KEY = 's'
  let urlLock = false
  let stateLock = false

  const getAppStateFromUrl = async (route) => {
    const query = route.query || {}
    if (query[QUERY_KEY]) {
      // new style
      const raw = query[QUERY_KEY]
      return fromHashString(raw)
        .then(rawData => parseAppState(rawData))
    } else if (query['cfg']) {
      // old style
      const cfg = await fromHashString(query['cfg'])
      const panels = await fromHashString(query['panels'])
      return parseAppState({ version: 0, data: { cfg, panels } })
    } else {
      return null
    }
  }

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
      const state = await getAppStateFromUrl(to)
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
