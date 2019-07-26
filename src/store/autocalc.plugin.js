import worker from '@/workers/spdcalc'
const spdcalc = worker()

export const autoCalcMonitorPlugin = store => {
  // helper to ensure that the callback function wont
  // get called repeatedly, because the callback itself
  // modifies the state it's watching
  const mutatingCallback = fn => {
    let running = false
    return (...args) => {
      if ( running ) return
      running = true
      Promise.resolve( fn.apply(null, args) ).finally( () => {
        running = false
      })
    }
  }

  // auto calc theta
  store.watch(
    (state, getters) =>
      getters['parameters/autoCalcTheta'] &&
      getters['parameters/spdConfig']
    , mutatingCallback(( cfg ) => {
      // not autocaculating
      if ( !cfg ) return

      return spdcalc.calculateCrystalTheta( cfg ).then( theta => {
        store.commit('parameters/setCrystalTheta', theta)
      }).catch(error => {
        store.dispatch('error', { error, context: 'while calculating crystal theta' }, { root: true })
      })
    })
    , { immediate: true, deep: true }
  )

  // auto calc periodic poling
  store.watch(
    (state, getters) =>
      getters['parameters/autoCalcPeriodicPoling'] &&
      getters['parameters/spdConfig']
    , mutatingCallback(( cfg ) => {
      // not autocaculating
      if ( !cfg ) return

      return spdcalc.calculatePeriodicPoling( cfg ).then( period => {
        store.commit('parameters/setPolingPeriod', period)
      }).catch(error => {
        store.dispatch('error', { error, context: 'while calculating poling period' }, { root: true })
      })
    })
    , { immediate: true, deep: true }
  )
}
