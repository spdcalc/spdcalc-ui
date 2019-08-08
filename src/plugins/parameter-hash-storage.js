export default function(store, router){
  store.watch((state, getters) =>
    getters['parameters/hashableObject']
  , (obj) => {
    let hash = store.getters['parameters/hashString']
    let oldHash = router.currentRoute.query.cfg

    if ( hash === oldHash ){ return }

    router.replace({ query: { cfg: hash } })
  }, { immediate: false, deep: true })

  router.beforeEach((to, from, next) => {
    let hash = store.getters['parameters/hashString']
    let newHash = to.query.cfg

    if ( hash === newHash ){
      // duplicate
      return next()
    }

    store.dispatch('parameters/loadFromHash', newHash)
      .then( () => next() )
  })

  // little fix so that autocomputed properties don't interfere with
  // loading from hash
  router.onReady(() => {
    store.commit('parameters/editing', false)
  })
}
