import Vue from 'vue'
import _get from 'lodash/get'

const initialState = {
  jobs: {}
  , latest: false
}

export const jobs = {
  namespaced: true
  , state: initialState
  , getters: {
    latestJob: state => state.latest
    , jobs: state => state.jobs
    , runTime: state => job => _get(state, `jobs.${job}.runTime`, 0)
    , isRunning: state => job => _get(state, `jobs.${job}.running`, false)
  }
  , actions: {
    start({ dispatch, commit, getters, rootGetters }, { job }) {
      if ( !job ){ throw new Error('Must specify job id') }

      if ( getters.isRunning(job) ){ return }
      commit('start', { job })
    }
    , complete({ dispatch, commit, getters, rootGetters }, { job }) {
      if ( !job ){ throw new Error('Must specify job id') }

      if ( !getters.isRunning(job) ){ return }
      commit('complete', { job })
    }
  }
  , mutations: {
    start(state, { job }) {
      Vue.set(state.jobs, job, {
        runTime: 0
        , startTime: window.performance.now()
        , endTime: 0
        , running: true
      })

      state.latest = job
    }
    , complete(state, { job }){
      let startTime = state.jobs[job].startTime
      let endTime = window.performance.now()
      let runTime = endTime - startTime

      Vue.set(state.jobs, job, {
        runTime
        , startTime: 0
        , endTime
        , running: false
      })
    }
  }
}
