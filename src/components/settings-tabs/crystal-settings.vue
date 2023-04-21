<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(align-start, wrap)
    v-flex(xs12)
      ParameterSelector(
        property-getter="parameters/crystal"
        , property-mutation="parameters/setCrystal"
        , items-getter="parameters/crystalTypes"
        , tooltip="The crystal type"
      )
    v-flex(xs12)
      ParameterSelector(
        property-getter="parameters/pmType"
        , property-mutation="parameters/setPmType"
        , items-getter="parameters/pmTypes"
        , tooltip="The phasematching type"
      )
    v-flex(xs6)
      ParameterInput(
        label="θ"
        , lazy
        , units="°"
        , property-getter="parameters/crystalTheta"
        , property-mutation="parameters/setCrystalTheta"
        , auto-calc-getter="parameters/autoCalcTheta"
        , auto-calc-mutation="parameters/setAutoCalcTheta"
        , tooltip="The crystal azimuthal angle [0°, 180°)"
        , :min="0"
        , :max="180"
      )
    v-flex(xs6)
      ParameterInput(
        label="ϕ"
        , lazy
        , units="°"
        , property-getter="parameters/crystalPhi"
        , property-mutation="parameters/setCrystalPhi"
        , tooltip="The crystal polar angle [0°, 360°)"
        , :min="0"
        , :max="360"
      )
    v-flex(xs6)
      ParameterInput(
        label="L"
        , lazy
        , units="µm"
        , property-getter="parameters/crystalLength"
        , property-mutation="parameters/setCrystalLength"
        , tooltip="The length of the crystal"
        , :min="0.01"
      )
    v-flex(xs6)
      ParameterInput(
        label="T"
        , lazy
        , units="°C"
        , property-getter="parameters/crystalTemperature"
        , property-mutation="parameters/setCrystalTemperature"
        , tooltip="The temperature of the crystal"
        , :min="-273.15"
      )
    v-flex(xs12)
      ParameterInput(
        label="deff"
        , lazy
        , units="pm/V"
        , property-getter="parameters/deff"
        , property-mutation="parameters/setDeff"
        , tooltip="The crystal effective nonlinear coefficient"
        , :min="0"
      )
</template>

<script>
import { mapGetters } from 'vuex'
import ParameterSelector from '@/components/inputs/parameter-selector.vue'
import ParameterInput from '@/components/inputs/parameter-input.vue'

export default {
  name: 'CrystalSettings'
  , props: {
  }
  , data: () => ({
  })
  , components: {
    ParameterSelector
    , ParameterInput
  }
  , computed: {
    ...mapGetters('parameters', {
      ppEnabled: 'periodicPolingEnabled'
    })
  }
  , methods: {
  }
}
</script>
