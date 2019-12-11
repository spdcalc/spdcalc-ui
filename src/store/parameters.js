import _keyBy from 'lodash/keyBy'
import _pick from 'lodash/pick'
import _sortBy from 'lodash/sortBy'
import worker from '@/workers/spdcalc'
import { fromHashString, toHashableString } from '@/lib/url-hash-utils'
import Promise from 'bluebird'

// This value controls what "much larger means" when talking about conditions like "x >> y"
// In that case x > MUCH_LARGER * y
const MUCH_LARGER = 20
const HASH_FIELDS = [
  'autoCalcTheta'
  , 'autoCalcPeriodicPoling'
  , 'autoCalcIntegrationLimits'
  , 'spdConfig'
  , 'integrationConfig'
]

const spdcalc = worker()

// const crystalTypes = [
//   'BBO_1'
//   , 'KTP'
//   , 'BiBO_1'
//   , 'LiIO3_1'
//   , 'AgGaS2_1'
// ]

const pmTypes = [
  {
    text: 'Type 0: o ⇒ o + o'
    , value: 'Type0_o_oo'
  }
  , {
    text: 'Type 0: e ⇒ e + e'
    , value: 'Type0_e_ee'
  }
  , {
    text: 'Type 1: e ⇒ o + o'
    , value: 'Type1_e_oo'
  }
  , {
    text: 'Type 2: e ⇒ e + o'
    , value: 'Type2_e_eo'
  }
  , {
    text: 'Type 2: e ⇒ o + e'
    , value: 'Type2_e_oe'
  }
]

const initialState = () => ({
  crystalTypes: [] // fetched
  , pmTypes

  , isReady: false
  , isEditing: true // to be set to false on initial load
  , autoCalcTheta: true
  , autoCalcPeriodicPoling: true
  , autoCalcIntegrationLimits: true
  , autoCalcWaistPosition: true
  , crystalMeta: null

  , refractiveIndices: {
    np: 1
    , ns: 1
    , ni: 1
  }

  , spdConfig: {
    crystal: 'KTP'
    , pm_type: pmTypes[3].value
    , crystal_theta: 90
    , crystal_phi: 0
    , crystal_length: 2000
    , crystal_temperature: 20

    , fiber_coupling: true

    , pump_wavelength: 775
    , pump_bandwidth: 5.35
    , pump_waist: 100
    , pump_spectrum_threshold: 1e-1

    , signal_wavelength: 1550
    , signal_theta: 0
    , signal_phi: 0
    , signal_bandwidth: 1
    , signal_waist: 100
    , signal_waist_position: 0

    , idler_wavelength: 1550
    , idler_theta: 0
    , idler_phi: 180
    , idler_bandwidth: 1
    , idler_waist: 100
    , idler_waist_position: 0

    , periodic_poling_enabled: true
    , poling_period: 1
    , apodization_enabled: false
    , apodization_fwhm: 1600
  }
  , integrationConfig: {
    ls_min: 1500
    , ls_max: 1600
    , li_min: 1500
    , li_max: 1600
    , size: 100
  }
})

export const parameters = {
  namespaced: true
  , state: initialState
  , getters: {
    isEditing: state => state.isEditing
    , hashableObject: state => _pick(state, HASH_FIELDS)
    , hashString: (state, getters) => toHashableString(getters.hashableObject)
    , crystalTypes: state => state.crystalTypes
    , pmTypes: state => state.pmTypes

    , spdConfig: state => ({ ...state.spdConfig })
    , integrationConfig: state => ({ ...state.integrationConfig })

    , isReady: state => state.isReady

    , crystal: state => state.spdConfig.crystal
    , crystalMeta: state => state.crystalMeta ? state.crystalMeta[state.spdConfig.crystal] : {}
    , pmType: state => state.spdConfig.pm_type
    , crystalTheta: state => state.spdConfig.crystal_theta
    , autoCalcTheta: state => state.autoCalcTheta
    , crystalPhi: state => state.spdConfig.crystal_phi
    , crystalLength: state => state.spdConfig.crystal_length
    , crystalTemperature: state => state.spdConfig.crystal_temperature

    , fiberCoupling: state => state.spdConfig.fiber_coupling

    , pumpWavelength: state => state.spdConfig.pump_wavelength
    , pumpBandwidth: state => state.spdConfig.pump_bandwidth
    , pumpWaist: state => state.spdConfig.pump_waist
    , pumpSpectrumThreshold: state => state.spdConfig.pump_spectrum_threshold

    , signalWavelength: state => state.spdConfig.signal_wavelength
    , signalTheta: state => state.spdConfig.signal_theta
    , signalPhi: state => state.spdConfig.signal_phi
    , signalBandwidth: state => state.spdConfig.signal_bandwidth
    , signalWaistPosition: state => state.spdConfig.signal_waist_position
    , signalWaist: state => state.spdConfig.signal_waist

    , idlerWavelength: (state, getters) => {
      let lp = getters.pumpWavelength
      let ls = getters.signalWavelength
      return ls * lp / (ls - lp)
    }
    , idlerTheta: state => state.spdConfig.idler_theta
    , idlerPhi: state => state.spdConfig.idler_phi
    , idlerBandwidth: state => state.spdConfig.idler_bandwidth
    , idlerWaistPosition: state => state.spdConfig.idler_waist_position
    , idlerWaist: state => state.spdConfig.idler_waist

    // , autoCalcWaistPosition: state => state.autoCalcWaistPosition
    , refractiveIndices: state => state.refractiveIndices

    , autoCalcPeriodicPoling: state => state.spdConfig.periodic_poling_enabled && state.autoCalcPeriodicPoling
    , periodicPolingEnabled: state => state.spdConfig.periodic_poling_enabled
    , polingPeriod: state => state.spdConfig.poling_period
    , apodizationEnabled: state => state.spdConfig.apodization_enabled
    , apodizationFWHM: state => state.spdConfig.apodization_fwhm

    , autoCalcIntegrationLimits: state => state.autoCalcIntegrationLimits
    , integrationXMin: state => state.integrationConfig.ls_min
    , integrationXMax: state => state.integrationConfig.ls_max
    , integrationYMin: state => state.integrationConfig.li_min
    , integrationYMax: state => state.integrationConfig.li_max
    , integrationGridSize: state => state.integrationConfig.size

    // minimum waist sizes according to paraxial approximation (W >> \lambda / n)
    , minPumpWaistSize: (state, getters) => MUCH_LARGER * (1e-9 / 1e-6) * getters.pumpWavelength / getters.refractiveIndices.np
    , minSignalWaistSize: (state, getters) => MUCH_LARGER * (1e-9 / 1e-6) * getters.signalWavelength / getters.refractiveIndices.ns
    , minIdlerWaistSize: (state, getters) => MUCH_LARGER * (1e-9 / 1e-6) * getters.idlerWavelength / getters.refractiveIndices.ni
  }
  , actions: {
    async init({ dispatch, commit, getters }){
      if ( getters.isReady ){ return }

      spdcalc.fetchCrystalMeta().then( results => {
        commit('receiveCrystalMeta', results)
      }).catch(error => {
        dispatch('error', { error, context: 'while fetching crystal meta' }, { root: true })
      })
    }
    , loadFromHash({ dispatch, commit, getters }, hash = ''){
      if ( getters.hashString === hash ){ return Promise.resolve() }

      commit('editing', true)
      return fromHashString(hash)
        .then( data => data || {} )
        .then( data => {
          commit('merge', data)
          commit('editing', false)
        })
        .catch( error => {
          dispatch('error', { error, context: 'while loading parameters from URL' }, { root: true })
        })
    }
  }
  , mutations: {
    clearAll(state) {
      // acquire initial state
      const s = initialState()
      Object.keys(s).forEach(key => {
        state[key] = s[key]
      })
    }
    , merge(state, data = {}){
      Object.keys(data).reverse().forEach(key => {
        if ( typeof state[key] === 'object' ){
          state[key] = { ...state[key], ...data[key] }
        } else {
          state[key] = data[key]
        }
      })
    }
    // is the user still editing parameters
    , editing(state, flag){ state.isEditing = !!flag }
    , receiveCrystalMeta(state, results){
      state.crystalMeta = _keyBy(results, 'id')
      state.crystalTypes = _sortBy(results.map(m => ({ value: m.id, text: m.name })), 'text')
      state.isReady = true
    }
    , setCrystal(state, name){ state.spdConfig.crystal = name }
    , setPmType(state, type){ state.spdConfig.pm_type = type }
    , setCrystalTheta(state, radians){ state.spdConfig.crystal_theta = +radians }
    , setAutoCalcTheta(state, flag){ state.autoCalcTheta = !!flag }
    , setCrystalPhi(state, radians){ state.spdConfig.crystal_phi = +radians }
    , setCrystalLength(state, microns){ state.spdConfig.crystal_length = +microns }
    , setCrystalTemperature(state, celsius){ state.spdConfig.crystal_temperature = +celsius }

    , setFiberCoupling(state, flag){ state.spdConfig.fiber_coupling = !!flag }

    , setPeriodicPolingEnabled(state, flag){ state.spdConfig.periodic_poling_enabled = !!flag }
    , setPolingPeriod(state, microns){ state.spdConfig.poling_period = +microns }
    , setAutoCalcPeriodicPoling(state, flag){ state.autoCalcPeriodicPoling = !!flag }

    , setApodizationEnabled(state, flag){ state.spdConfig.apodization_enabled = !!flag }
    , setApodizationFWHM(state, microns){ state.spdConfig.apodization_fwhm = +microns }

    , setPumpWavelength(state, nm){ state.spdConfig.pump_wavelength = +nm }
    , setPumpBandwidth(state, nm){ state.spdConfig.pump_bandwidth = +nm }
    , setPumpWaist(state, microns){ state.spdConfig.pump_waist = +microns }
    , setPumpSpectrumThreshold(state, unitless){ state.spdConfig.pump_spectrum_threshold = +unitless }

    , setSignalWavelength(state, nm){ state.spdConfig.signal_wavelength = +nm }
    , setSignalTheta(state, radians){ state.spdConfig.signal_theta = +radians }
    , setSignalPhi(state, radians){ state.spdConfig.signal_phi = +radians }
    , setSignalBandwidth(state, nm){ state.spdConfig.signal_bandwidth = +nm }
    , setSignalWaistPosition(state, microns){ state.spdConfig.signal_waist_position = +microns }
    , setSignalWaist(state, microns){ state.spdConfig.signal_waist = +microns }

    , setIdlerWavelength(state, nm){ state.spdConfig.idler_wavelength = +nm }
    , setIdlerTheta(state, radians){ state.spdConfig.idler_theta = +radians }
    , setIdlerPhi(state, radians){ state.spdConfig.idler_phi = +radians }
    , setIdlerBandwidth(state, nm){ state.spdConfig.idler_bandwidth = +nm }
    , setIdlerWaistPosition(state, microns){ state.spdConfig.idler_waist_position = +microns }
    , setIdlerWaist(state, microns){ state.spdConfig.idler_waist = +microns }

    , setRefractiveIndices(state, { np, ns, ni }){
      state.refractiveIndices.np = +np
      state.refractiveIndices.ns = +ns
      state.refractiveIndices.ni = +ni
    }

    // , setAutoCalcWaistPosition(state, flag){ state.autoCalcWaistPosition = !!flag }

    , setAutoCalcIntegrationLimits(state, flag){ state.autoCalcIntegrationLimits = !!flag }
    , setIntegrationXMin(state, nm){ state.integrationConfig.ls_min = +nm }
    , setIntegrationXMax(state, nm){ state.integrationConfig.ls_max = +nm }
    , setIntegrationYMin(state, nm){ state.integrationConfig.li_min = +nm }
    , setIntegrationYMax(state, nm){ state.integrationConfig.li_max = +nm }
    , setIntegrationGridSize(state, size){ state.integrationConfig.size = size | 0 }
  }
}
