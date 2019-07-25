import Vue from 'vue'
import Vuex from 'vuex'

import { alerts } from './alerts'
import { jobs } from './jobs'
import { parameters } from './parameters'
import { autoCalcMonitorPlugin } from './autocalc.plugin'

Vue.use(Vuex)

const prefetcher = store => store.dispatch('parameters/fetchCrystalMeta')

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production'
  , plugins: [prefetcher, autoCalcMonitorPlugin]
  , modules: {
    alerts
    , jobs
    , parameters
  }
})
