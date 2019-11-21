<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(align-start, wrap)
    v-flex(md12, sm6, xs12)
      ParameterSelector(
        property-getter="parameters/crystal"
        , property-mutation="parameters/setCrystal"
        , items-getter="parameters/crystalTypes"
        , tooltip="The crystal type"
      )
    v-flex(md12, sm6, xs12)
      ParameterSelector(
        property-getter="parameters/pmType"
        , property-mutation="parameters/setPmType"
        , items-getter="parameters/pmTypes"
        , tooltip="The phasematching type"
      )
    v-flex(md8, sm3, xs8)
      ParameterInput(
        label="θ"
        , lazy
        , units="°"
        , property-getter="parameters/crystalTheta"
        , property-mutation="parameters/setCrystalTheta"
        , auto-calc-getter="parameters/autoCalcTheta"
        , auto-calc-mutation="parameters/setAutoCalcTheta"
        , tooltip="The crystal azimuthal angle [0°, 180°)"
      )
    v-flex(md4, sm3, xs4)
      ParameterInput(
        label="ϕ"
        , lazy
        , units="°"
        , property-getter="parameters/crystalPhi"
        , property-mutation="parameters/setCrystalPhi"
        , tooltip="The crystal polar angle [0°, 360°)"
      )
    v-flex(md12, sm3, xs6)
      ParameterInput(
        label="Length"
        , lazy
        , units="µm"
        , property-getter="parameters/crystalLength"
        , property-mutation="parameters/setCrystalLength"
        , tooltip="The length of the crystal"
      )
    v-flex(md12, sm3, xs6)
      ParameterInput(
        label="Temp"
        , lazy
        , units="°C"
        , property-getter="parameters/crystalTemperature"
        , property-mutation="parameters/setCrystalTemperature"
        , tooltip="The temperature of the crystal"
      )
</template>

<script>
import { mapGetters } from 'vuex'
import ParameterSelector from '@/components/inputs/parameter-selector'
import ParameterInput from '@/components/inputs/parameter-input'

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
