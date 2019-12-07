import _find from 'lodash/find'
import _findIndex from 'lodash/findIndex'

const presetInitialState = (id, name) => ({
  id
  , name
  , data: {}
})

const initialState = {
  selected: null
  , presets: []
}

export const presets = {
  namespaced: true
  , state: initialState
  , modules: {
  }
  , getters: {
    selected: (state, getters) => getters.getPreset(state.selected)
    , all: state => state.presets
    , getPreset: (state, getters) => (id) => _find(getters.all, { id })
  }
  , actions: {
    load({ commit }, { id }){
      commit('load', id)
    }
    , create({ commit, rootGetters }, { name }){
      commit('create', {
        name
        , data: {
          parameters: rootGetters['parameters/hashString']
        }
      })
    }
    , update({ commit, getters, rootGetters }, { id, name, withData }){
      let preset = getters.getPreset(id)
      let data = preset.data
      name = name || preset.name
      if (withData){
        data = {
          ...data
          , parameters: rootGetters['parameters/hashString']
        }
      }
      commit('update', { id, name, data })
    }
    , remove({ commit, getters }, { id }){
      if ( getters.selected === id ){
        commit('load', null)
      }
      commit('remove', id)
    }
  }
  , mutations: {
    load(state, id){
      state.selected = id
    }
    , create(state, { name, data }){
      let preset = presetInitialState(`ps${state.presets.length}`, name)
      state.presets.push({
        ...preset
        , data
      })
      state.selected = preset.id
    }
    , update(state, { id, name, data }){
      let idx = _findIndex(state.presets, { id })
      if ( idx < 0 ){ return }
      let preset = state.presets[idx]
      preset.name = name
      preset.data = data
    }
    , remove(state, id){
      let idx = _findIndex(state.presets, { id })
      if ( idx < 0 ){ return }
      state.presets.splice(idx, 1)
    }
  }
}
