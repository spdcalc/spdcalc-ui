import Promise from 'bluebird'
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
      !getters['parameters/isEditing'] &&
      getters['parameters/spdConfig']
    , mutatingCallback(( cfg ) => {
      // not autocaculating
      if ( !cfg ) return

      if (
        store.getters['parameters/periodicPolingEnabled'] &&
        store.getters['parameters/autoCalcPeriodicPoling']
      ){
        return store.commit('parameters/setCrystalTheta', 90)
      }

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
      !getters['parameters/isEditing'] &&
      getters['parameters/spdConfig']
    , mutatingCallback(( cfg ) => {
      // not autocaculating
      if ( !cfg ) return

      return spdcalc.calculatePeriodicPoling( cfg ).then( period => {
        store.commit('parameters/setPolingPeriod', period)
        if ( !period ){
          let message = 'No poling period needed for given setup. (hint: change crystal theta?)'
          store.dispatch('info', { message }, { root: true })
        }
      }).catch(error => {
        store.commit('parameters/setPolingPeriod', 0)
        store.dispatch('error', { error, context: 'while calculating poling period', timeout: 8000 }, { root: true })
      })
    })
    , { immediate: true, deep: true }
  )

  // auto calc waist position
  // store.watch(
  //   (state, getters) =>
  //     getters['parameters/autoCalcWaistPosition'] &&
  //     !getters['parameters/isEditing'] &&
  //     getters['parameters/spdConfig']
  //   , mutatingCallback(( cfg ) => {
  //     // not autocaculating
  //     if ( !cfg ) return
  //
  //     return spdcalc.calculateWaistPosition( cfg ).then( z => {
  //       store.commit('parameters/setSignalWaistPosition', z)
  //     }).catch(error => {
  //       store.dispatch('error', { error, context: 'while calculating waist position', timeout: 8000 }, { root: true })
  //     })
  //   })
  //   , { immediate: true, deep: true }
  // )

  // fetch waist positions
  store.watch(
    (state, getters) =>
      !getters['parameters/isEditing'] &&
      getters['parameters/spdConfig']
    , mutatingCallback(( cfg ) => {
      if ( !cfg ) return

      return spdcalc.getWaistPositions( cfg ).then( ([z0s, z0i]) => {
        store.commit('parameters/setSignalWaistPosition', z0s)
        store.commit('parameters/setIdlerWaistPosition', z0i)
      }).catch(error => {
        store.dispatch('error', { error, context: 'while fetching waist position', timeout: 8000 }, { root: true })
      })
    })
    , { immediate: true, deep: true }
  )

  // auto calc integration bounds
  store.watch(
    (state, getters) =>
      getters['parameters/autoCalcIntegrationLimits'] &&
      !getters['parameters/isEditing'] &&
      getters['parameters/spdConfig']
    , mutatingCallback(( cfg ) => {
      // not autocaculating
      if ( !cfg ) return

      return spdcalc.calculateJSIRanges( cfg ).then( ranges => {
        store.commit('parameters/setIntegrationXMin', ranges.ls_min)
        store.commit('parameters/setIntegrationXMax', ranges.ls_max)
        store.commit('parameters/setIntegrationYMin', ranges.li_min)
        store.commit('parameters/setIntegrationYMax', ranges.li_max)

      }).catch(error => {
        store.dispatch('error', { error, context: 'while auto calculating jsi ranges', timeout: 8000 }, { root: true })
      })
    })
    , { immediate: true, deep: true }
  )
}
