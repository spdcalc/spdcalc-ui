const crystalTypes = [
  'BBO_1'
  , 'KTP'
  , 'BiBO_1'
  , 'LiIO3_1'
  , 'AgGaS2_1'
]

const pmTypes = [
  {
    text: 'Type 0: o => o + o'
    , value: 'Type0_o_oo'
  }
  , {
    text: 'Type 0: e => e + e'
    , value: 'Type0_e_ee'
  }
  , {
    text: 'Type 1: e => o + o'
    , value: 'Type1_e_oo'
  }
  , {
    text: 'Type 2: e => e + o'
    , value: 'Type2_e_eo'
  }
  , {
    text: 'Type 2: e => o + e'
    , value: 'Type2_e_oe'
  }
]

const initialState = () => ({
  crystalTypes
  , pmTypes

  , autoCalcTheta: true
  , spdConfig: {
    crystal: crystalTypes[0]
    , pm_type: pmTypes[3].value
    , crystal_theta: 0
    , signal_wavelength: 1550
    , signal_bandwidth: 1
  }
  , jsiConfig: {
    ls_min: 1500
    , ls_max: 1600
    , li_min: 1500
    , li_max: 1600
    , size: 600
  }
})

export const parameters = {
  namespaced: true
  , state: initialState
  , getters: {
    crystalTypes: state => state.crystalTypes
    , pmTypes: state => state.pmTypes

    , spdConfig: state => state.spdConfig
    , jsiConfig: state => state.jsiConfig

    , crystal: state => state.spdConfig.crystal
    , pmType: state => state.spdConfig.pm_type
    , crystalTheta: state => state.spdConfig.crystal_theta
    , autoCalcTheta: state => state.autoCalcTheta
  }
  , actions: {
  }
  , mutations: {
    clearAll(state) {
      // acquire initial state
      const s = initialState()
      Object.keys(s).forEach(key => {
        state[key] = s[key]
      })
    }
    , setCrystal(state, name){
      state.spdConfig.crystal = name
    }
    , setPmType(state, type){
      state.spdConfig.pm_type = type
    }
    , setCrystalTheta(state, radians){
      state.spdConfig.crystal_theta = +radians
    }
    , setAutocalcTheta(state, flag){
      state.autoCalcTheta = !!flag
    }
  }
}
