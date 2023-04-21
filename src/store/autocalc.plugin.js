import Promise from 'bluebird'
import createWorker from '@/workers/spdcalc'
// new thread
const { worker: spdcalc } = createWorker()

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

  function watcher(state, getters){
    if ( !getters['parameters/isReady'] ){
      return false
    }
    return {
      autoCalcTheta: getters['parameters/autoCalcTheta']
      , autoCalcPeriodicPoling: getters['parameters/autoCalcPeriodicPoling']
      , autoCalcIntegrationLimits: getters['parameters/autoCalcIntegrationLimits']
      , spdConfig: getters['parameters/spdConfig']
      , autoCalcSignalWaistPosition: getters['parameters/autoCalcSignalWaistPosition']
      , autoCalcIdlerWaistPosition: getters['parameters/autoCalcIdlerWaistPosition']
    }
  }

  const calcTheta = Promise.method(() => {
    const cfg = store.getters['parameters/spdConfig']
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
      throw error
    })
  })

  const calcPP = Promise.method(() => {
    const cfg = store.getters['parameters/spdConfig']
    return spdcalc.calculatePeriodicPoling( cfg ).then( period => {
      store.commit('parameters/setPolingPeriod', period)
      if ( !period ){
        let message = 'No poling period needed for given setup. (hint: change crystal theta?)'
        store.dispatch('info', { message }, { root: true })
      }
    }).catch(error => {
      store.commit('parameters/setPolingPeriod', 0)
      store.dispatch('error', { error, context: 'while calculating poling period', timeout: 8000 }, { root: true })
      throw error
    })
  })

  const getWaistPositions = Promise.method((data) => {
    const cfg = store.getters['parameters/spdConfig']
    return spdcalc.getWaistPositions( cfg ).then( ([z0s, z0i]) => {
      if (data.autoCalcSignalWaistPosition){
        store.commit('parameters/setSignalWaistPosition', z0s)
      }
      if (data.autoCalcIdlerWaistPosition){
        store.commit('parameters/setIdlerWaistPosition', z0i)
      }
    }).catch(error => {
      store.dispatch('error', { error, context: 'while fetching waist position', timeout: 8000 }, { root: true })
      throw error
    })
  })

  const getRefractiveIndices = Promise.method(() => {
    const cfg = store.getters['parameters/spdConfig']
    return spdcalc.getRefractiveIndices( cfg ).then( ([np, ns, ni]) => {
      store.commit('parameters/setRefractiveIndices', { np, ns, ni })
    }).catch(error => {
      store.dispatch('error', { error, context: 'while fetching refractive indices', timeout: 8000 }, { root: true })
      throw error
    })
  })

  const calcIntegrationLimits = Promise.method(() => {
    const cfg = store.getters['parameters/spdConfig']
    return spdcalc.calculateJSIRanges( cfg ).then( ranges => {
      store.commit('parameters/setIntegrationXMin', ranges.ls_min.toFixed(0))
      store.commit('parameters/setIntegrationXMax', ranges.ls_max.toFixed(0))
      store.commit('parameters/setIntegrationYMin', ranges.li_min.toFixed(0))
      store.commit('parameters/setIntegrationYMax', ranges.li_max.toFixed(0))

    }).catch(error => {
      store.dispatch('error', { error, context: 'while auto calculating jsi ranges', timeout: 8000 }, { root: true })
      throw error
    })
  })

  async function listener(data){
    try {
      if (!data){ return }

      if (data.autoCalcTheta){
        await calcTheta()
      }

      if (data.autoCalcPeriodicPoling){
        await calcPP()
      }

      if (data.autoCalcSignalWaistPosition || data.autoCalcIdlerWaistPosition){
        await getWaistPositions(data)
      }

      await getRefractiveIndices()

      if (data.autoCalcIntegrationLimits){
        await calcIntegrationLimits()
      }
    } catch (error){
      // logged by others
    }
  }

  store.watch(watcher, mutatingCallback(listener), { immediate: true, deep: true })
}
