<template lang="pug">
v-container.properties(fluid, grid-list-lg, px-0, py-4)
  v-layout(align-start, wrap)
    v-flex(sm3)
      CrystalSelector
    v-flex(sm6)
      v-sheet.crystal-info
        .citation H. Vanherzeele, J. D. Bierlein, F. C. Zumsteg, Appl. Opt., 27, 3314 (1988)
        a(href="http://google.com") more info
    v-flex(sm3)
      PmTypeSelector
  v-layout(align-start, wrap)
    v-flex(sm3)
      ParameterInput(
        label="Theta (°)"
        , property-getter="parameters/crystalTheta"
        , property-mutation="parameters/setCrystalTheta"
        , auto-calc-getter="parameters/autoCalcTheta"
        , auto-calc-mutation="parameters/setAutocalcTheta"
        , :conversion-factor="180/Math.PI"
      )
    v-flex(sm3)
      ParameterInput(
        label="Phi (°)"
        , property-getter="parameters/crystalPhi"
        , property-mutation="parameters/setCrystalPhi"
        , :conversion-factor="180/Math.PI"
      )
    v-flex(sm3)
      ParameterInput(
        label="Length"
        , units="µm"
        , property-getter="parameters/crystalLength"
        , property-mutation="parameters/setCrystalLength"
      )
    v-flex(sm3)
      ParameterInput(
        label="Temperature"
        , units="°C"
        , property-getter="parameters/crystalTemperature"
        , property-mutation="parameters/setCrystalTemperature"
      )
</template>

<script>
// import { mapGetters } from 'vuex'
import CrystalSelector from '@/components/inputs/crystal-selector'
import PmTypeSelector from '@/components/inputs/pmtype-selector'
import ParameterInput from '@/components/inputs/parameter-input'

export default {
  name: 'CrystalSettings'
  , props: {
  }
  , data: () => ({
  })
  , components: {
    CrystalSelector
    , PmTypeSelector
    , ParameterInput
  }
  , computed: {
  }
  , methods: {
  }
}
</script>
