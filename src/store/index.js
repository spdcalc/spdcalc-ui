import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'

import _pick from 'lodash/pick'
import { alerts } from './alerts'
import { jobs } from './jobs'
import { parameters } from './parameters'
import { panels } from './panels'
import { presets } from './presets'
import { presetLoaderPlugin } from './preset-loader.plugin'
import { autoCalcMonitorPlugin } from './autocalc.plugin'

Vue.use(Vuex)

// init local storage for some vuex modules
const LOCAL_STORAGE_MODULES = ['presets.presets']
const vuexPersist = new VuexPersistence({
  strictMode: process.env.NODE_ENV !== 'production'
  , key: 'spdcalc'
  , storage: window.localStorage
  , reducer: state => _pick(state, LOCAL_STORAGE_MODULES)
})

const prefetcher = store => store.dispatch('parameters/init')

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production'
  , plugins: [
    prefetcher
    , autoCalcMonitorPlugin
    , presetLoaderPlugin
    , vuexPersist.plugin
  ]
  , mutations: {
    RESTORE_MUTATION: vuexPersist.RESTORE_MUTATION
  }
  , modules: {
    alerts
    , jobs
    , parameters
    , panels
    , presets
  }
})
