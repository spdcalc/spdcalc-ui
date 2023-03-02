export default function(store, router){
  store.watch((state, getters) =>
    getters['parameters/hashableObject']
  , (obj) => {
    let hash = store.getters['parameters/hashString']
    let query = router.currentRoute.query
    let oldHash = query.cfg

    if ( hash === oldHash ){ return }

    router.replace({ query: { ...query, cfg: hash } })
  }, { immediate: false, deep: true })

  const loadParams = (to, from, next) => {
    let hash = store.getters['parameters/hashString']
    let newHash = to.query.cfg

    if ( hash === newHash ){
      // duplicate
      return next()
    }

    store.dispatch('parameters/loadFromHash', newHash)
      .then( () => next() )
  }

  // little fix so that autocomputed properties don't interfere with
  // loading from hash
  router.onReady(() => {
    store.commit('parameters/editing', false)
  })

  // panels
  store.watch((state, getters) =>
    getters['panels/hashableObject']
  , (obj) => {
    let hash = store.getters['panels/hashString']
    let query = router.currentRoute.query
    let oldHash = query.panels

    if ( hash === oldHash ){ return }

    router.replace({ query: { ...query, panels: hash } })
  }, { immediate: false, deep: true })

  const loadPanels = (to, from, next) => {
    let hash = store.getters['panels/hashString']
    let newHash = to.query.panels
    console.log(newHash, hash)
    if ( hash === newHash ){
      // duplicate
      return next()
    }

    store.dispatch('panels/loadFromHash', newHash)
      .then( () => next() )
  }

  router.beforeEach((to, from, next) => {
    loadParams(to, from, next)
    loadPanels(to, from, next)
  })
}
