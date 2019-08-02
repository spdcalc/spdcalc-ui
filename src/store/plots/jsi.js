import _debounce from 'lodash/debounce'
import worker from '@/workers/spdcalc'
const spdcalc = worker()

const initialState = {
  loading: false
  , data: null
}

function createGroupedArray(arr, chunkSize) {
  let groups = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize))
  }
  return groups
}

export const jsi = {
  namespaced: true
  , state: initialState
  , getters: {
    isLoading: state => state.working
    , data: state => state.data
  }
  , actions: {
    calculate: _debounce(({ state, dispatch, commit, rootGetters }) => {
      commit('start')
      dispatch('jobs/start', { job: 'jsi' }, { root: true })
      spdcalc.getJSI( rootGetters['parameters/spdConfig'], rootGetters['parameters/integrationConfig'] )
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
    start(state) {
      state.loading = true
    }
    , done(state, { data }){
      state.loading = false
      state.data = data
    }
  }
}
