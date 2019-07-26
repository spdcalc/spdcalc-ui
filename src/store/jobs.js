import worker from '@/workers/spdcalc'
const spdcalc = worker()

const initialState = {
  working: false
  , job: ''
  , runTime: 0
}

export const jobs = {
  namespaced: true
  , state: initialState
  , getters: {
    runTime: state => state.runTime
    , jobName: state => state.job
    , isLoading: state => state.working
  }
  , actions: {
    getJSI({ state, dispatch, commit, rootGetters }) {
      commit('start', { job: 'jsi' })
      let startTime = window.performance.now()
      return spdcalc.getJSI( rootGetters['parameters/spdConfig'], rootGetters['parameters/integrationConfig'] )
        .catch(error => {
          dispatch('error', { error, context: 'while calculating JSI' }, { root: true })
          throw error
        })
        .finally(() => {
          let endTime = window.performance.now()
          let duration = endTime - startTime
          commit('done', { duration })
        })
    }
  }
  , mutations: {
    start(state, { job }) {
      state.working = true
      state.job = job
    }
    , done(state, { duration }){
      state.working = false
      state.runTime = duration
    }
  }
}
