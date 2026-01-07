import _uniqueId from 'lodash/uniqueId'
import _find from 'lodash/find'
import _findIndex from 'lodash/findIndex'
import _cloneDeep from 'lodash/cloneDeep'
import AllPanels from '@/components/panels'
import { fromHashString, toHashableString } from '@/lib/url-hash-utils'
import { parseAppState, createAppState, CURRENT_VERSION } from '@/store/app-state/migrations'

const initialPanelState = (type = 'PanelLoader') => {
  let props = {}
  let cfg = _find(AllPanels, { type })
  let component = type

  if ( cfg ){
    props = cfg.props
    component = cfg.component.name
  }

  return {
    id: _uniqueId('panel-')
    , type
    , component
    , props
    , settings: {}
    , data: []
  }
}

const initialState = {
  panels: [
    initialPanelState('joint-spectrum')
    , initialPanelState()
  ]
}

export const panels = {
  namespaced: true
  , state: initialState
  , modules: {
  }
  , getters: {
    allPanelTypes: () => AllPanels.map(({ label, component }) => ({ label, type: component.name }))

    , hashableObject: state => state.panels.map(({ type, settings }) => ({ type, settings }))
    , hashString: (state, getters) => {
      const appState = createAppState(getters.hashableObject)
      return toHashableString(appState)
    }

    , panel: (state) => (id) => _find(state.panels, { id })
    , panels: state => state.panels
  }
  , actions: {
    loadFromHash({ dispatch, commit, getters }, hash = ''){
      if ( getters.hashString === hash ){ return Promise.resolve() }

      return fromHashString(hash)
        .then(rawData => parseAppState(rawData))  // Parse and migrate
        .then(({ version, data }) => {
          // Sanity check and logging
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Panels] Loaded from URL (v${version} → v${CURRENT_VERSION})`)

            // Warn if URL is from newer app version
            if (version > CURRENT_VERSION) {
              console.warn(`[Panels] WARNING: URL version (v${version}) > app version (v${CURRENT_VERSION})`)
            }
          }

          if ( !data ){ return }
          commit('loadPanelsBulk', data)
        })
        .catch( error => {
          dispatch('error', { error, context: 'while loading panels from hash' }, { root: true })
        })
    }
    , loadPanel({ commit }, { id, type }){
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
    loadPanelsBulk(state, panels){
      const ps = panels.map(({ type, settings }) => {
        return {
          ...initialPanelState(type)
          , settings
        }
      })
      if (ps[ps.length - 1].type !== 'PanelLoader'){
        ps.push(initialPanelState())
      }
      state.panels = ps
    }
    , loadPanel(state, { id, type }){
      let idx = _findIndex(state.panels, { id })
      if ( idx < 0 ){ return }

      let p = { ...initialPanelState(type), id }
      state.panels.splice(idx, 1, p)
      state.panels.push(initialPanelState())
    }
    , unloadPanel(state, { id }){
      let idx = _findIndex(state.panels, { id })
      if ( idx < 0 ){ return }

      state.panels.splice(idx, 1)
    }
    , setPanelSettings(state, { id, settings }){
      let idx = _findIndex(state.panels, { id })
      if ( idx < 0 ){ return }

      state.panels[idx].settings = _cloneDeep(settings)
    }
    , setPanelData(state, { id, data }){
      let idx = _findIndex(state.panels, { id })
      if ( idx < 0 ){ return }

      state.panels[idx].data = _cloneDeep(data)
    }
  }
}
