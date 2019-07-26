
const initialState = {
  errors: []
  , infos: []
}

export const alerts = {
  namespaced: false
  , state: initialState
  , getters: {
    hasError: state => state.errors.length > 0
    , hasInfo: state => state.infos.length > 0
    , errors: state => state.errors
    , infos: state => state.infos
  }
  , actions: {
    error({ state, dispatch, commit }, { error, context }) {
      commit('addError', { error, context })
      return error
    }
    , clearErrors({ state, dispatch, commit }) {
      commit('clearErrors')
    }
    , info({ state, dispatch, commit }, { info }) {
      commit('addInfo', { info })
      return info
    }
    , clearInfos({ state, dispatch, commit }) {
      commit('clearInfos')
    }
  }
  , mutations: {
    clearAll(state) {
      state.errors = []
      state.infos = []
    }
    , addError(state, { error, context }){
      state.errors.push({ error, context })
    }
    , addInfo(state, { info }){
      state.infos.push( info )
    }
    , clearErrors(state){
      state.errors = []
    }
    , clearInfos(state){
      state.infos = []
    }
  }
}
