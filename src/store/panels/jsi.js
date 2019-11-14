import _debounce from 'lodash/debounce'
import _isEqual from 'lodash/isEqual'
import worker from '@/workers/spdcalc'
import { createGroupedArray } from '@/lib/data-utils'
const spdcalc = worker()

const initialState = {
  loading: false
  , data: null
  , inputArgs: []
}

export const jsi = {
  namespaced: true
  , state: initialState
  , getters: {
    isLoading: state => state.loading
    , data: state => state.data
  }
  , actions: {
    calculate: _debounce(({ state, dispatch, commit, rootGetters }) => {

      let args = [ rootGetters['parameters/spdConfig'], rootGetters['parameters/integrationConfig'] ]
      if ( _isEqual(args, state.inputArgs) ){
        // early out if there is no change
        return
      }

      commit('start', args)
      dispatch('jobs/start', { job: 'jsi' }, { root: true })

      spdcalc.getJSI( args[0], args[1] )
        .then( data => {
          commit('done', { data: createGroupedArray(data, rootGetters['parameters/integrationConfig'].size) })
        })
        .catch(error => {
          commit('done', { data: null })
          dispatch('error', { error, context: 'while calculating JSI' }, { root: true })
          throw error
        })
        .finally(() => {
          dispatch('jobs/complete', { job: 'jsi' }, { root: true })
        })
    }, 300)
  }
  , mutations: {
    start(state, args = []) {
      state.loading = true
      state.inputArgs = args
    }
    , done(state, { data }){
      state.loading = false
      state.data = data
    }
  }
}
