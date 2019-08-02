<template lang="pug">
v-container(fluid)
  v-layout(align-start, wrap)
    v-flex(xs12)
      CrystalSelector
    v-flex(xs12)
      PmTypeSelector
    v-flex(xs12)
      v-layout(align-start)
        v-flex.pr-2(xs6)
          ParameterInput(
            label="Theta (°)"
            , property-getter="parameters/crystalTheta"
            , property-mutation="parameters/setCrystalTheta"
            , auto-calc-getter="parameters/autoCalcTheta"
            , auto-calc-mutation="parameters/setAutocalcTheta"
          )
        v-flex.pl-2(xs6)
          ParameterInput(
            label="Phi (°)"
            , property-getter="parameters/crystalPhi"
            , property-mutation="parameters/setCrystalPhi"
          )
    v-flex(xs12)
      v-layout(align-start, wrap)
        v-flex.pr-2(xs6)
          ParameterInput(
            label="Length"
            , units="µm"
            , property-getter="parameters/crystalLength"
            , property-mutation="parameters/setCrystalLength"
          )
        v-flex.pr-2(xs6)
          ParameterInput(
            label="Temperature"
            , units="°C"
            , property-getter="parameters/crystalTemperature"
            , property-mutation="parameters/setCrystalTemperature"
          )
</template>

<script>
import { mapGetters } from 'vuex'
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
    ...mapGetters('parameters', {
      ppEnabled: 'periodicPolingEnabled'
    })
  }
  , methods: {
  }
}
</script>
