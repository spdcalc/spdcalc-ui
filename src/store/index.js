import Vue from 'vue'
import Vuex from 'vuex'

import { alerts } from './alerts'
import { jobs } from './jobs'
import { parameters } from './parameters'

import worker from '@/workers/spdcalc'
const spdcalc = worker()

const autoCalcMonitorPlugin = store => {
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

  store.watch(
    (state, getters) => getters['parameters/autoCalcTheta'] && getters['parameters/spdConfig']
    , mutatingCallback(( cfg ) => {
      // not autocaculating
      if ( !cfg ) return

      return spdcalc.calculateCrystalTheta( cfg ).then( theta => {
        store.commit('parameters/setCrystalTheta', theta)
      })
    })
    , { immediate: true, deep: true }
  )
}

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production'
  , plugins: [autoCalcMonitorPlugin]
  , modules: {
    alerts
    , jobs
    , parameters
  }
})
