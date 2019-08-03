<template lang="pug">
v-container.py-0(fluid)
  v-layout(align-start, wrap)
    v-flex(xs12)
      ParameterSelector(
        property-getter="parameters/crystal"
        , property-mutation="parameters/setCrystal"
        , items-getter="parameters/crystalTypes"
      )
    v-flex(xs12)
      ParameterSelector(
        property-getter="parameters/pmType"
        , property-mutation="parameters/setPmType"
        , items-getter="parameters/pmTypes"
      )
    v-flex(xs12)
      v-layout(align-start)
        v-flex.pr-1(xs8)
          ParameterInput(
            label="θ"
            , units="°"
            , property-getter="parameters/crystalTheta"
            , property-mutation="parameters/setCrystalTheta"
            , auto-calc-getter="parameters/autoCalcTheta"
            , auto-calc-mutation="parameters/setAutocalcTheta"
          )
        v-flex.pl-1(xs4)
          ParameterInput(
            label="ϕ"
            , units="°"
            , property-getter="parameters/crystalPhi"
            , property-mutation="parameters/setCrystalPhi"
          )
    v-flex(xs12)
      ParameterInput(
        label="Length"
        , units="µm"
        , property-getter="parameters/crystalLength"
        , property-mutation="parameters/setCrystalLength"
      )
    v-flex(xs12)
      ParameterInput(
        label="Temperature"
        , units="°C"
        , property-getter="parameters/crystalTemperature"
        , property-mutation="parameters/setCrystalTemperature"
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
