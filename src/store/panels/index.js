import _uniqueId from 'lodash/uniqueId'
import _find from 'lodash/find'
import _findIndex from 'lodash/findIndex'
import AllPanels from '@/components/panels'
import { jsi } from './jsi'

const initialPanelState = (type = 'PanelLoader') => {
  let props = {}
  let cfg = _find(AllPanels, { type })

  if ( cfg ){
    props = cfg.props
  }

  return {
    id: _uniqueId('panel-')
    , type
    , props
    , settings: {}
    , data: []
  }
}

const initialState = {
  panels: [
    initialPanelState()
    , initialPanelState()
    , initialPanelState()
    , initialPanelState()
  ]
}

export const panels = {
  namespaced: true
  , state: initialState
  , modules: {
    jsi
  }
  , getters: {
    allPanelTypes: () => AllPanels.map(({ label, component }) => ({ label, type: component.name }))
    , panel: (state) => (id) => _find(state.panels, { id })
    , panels: state => state.panels
  }
  , actions: {
    loadPanel({ commit }, { id, type }){
      commit('loadPanel', { id, type })
    }
    , unloadPanel({ commit }, { id }){
      commit('unloadPanel', { id })
    }
    , setPanelSettings({ commit }, { id, settings }){
      commit('setPanelSettings', { id, settings })
    }
    , setPanelData({ commit }, { id, data }){
      commit('setPanelData', { id, data })
    }
  }
  , mutations: {
    loadPanel(state, { id, type }){
      let idx = _findIndex(state.panels, { id })
      if ( idx < 0 ){ return }

      let p = { ...initialPanelState(type), id }
      state.panels.splice(idx, 1, p)
    }
    , unloadPanel(state, { id }){
      let idx = _findIndex(state.panels, { id })
      if ( idx < 0 ){ return }

      state.panels.splice(idx, 1, initialPanelState())
    }
    , setPanelSettings(state, { id, settings }){
      let idx = _findIndex(state.panels, { id })
      if ( idx < 0 ){ return }

      state.panels[idx].settings = settings
    }
    , setPanelData(state, { id, data }){
      let idx = _findIndex(state.panels, { id })
      if ( idx < 0 ){ return }

      state.panels[idx].data = data
    }
  }
}
