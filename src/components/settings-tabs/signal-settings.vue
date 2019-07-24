<template lang="pug">
v-container.properties(fluid, grid-list-lg, px-0, pt-5, pb-0)
  v-layout(align-start)
    v-flex(sm3)
      ParameterInput(
        label="Wavelength"
        , units="nm"
        , property-getter="parameters/signalWavelength"
        , property-mutation="parameters/setSignalWavelength"
      )
      ParameterInput(
        label="Waist 1/e²"
        , units="µm"
        , property-getter="parameters/signalWaist"
        , property-mutation="parameters/setSignalWaist"
      )
    v-flex(sm3)
      ParameterInput(
        label="Theta (°)"
        , property-getter="parameters/signalTheta"
        , property-mutation="parameters/setSignalTheta"
        , :conversion-factor="180/Math.PI"
      )
      ParameterInput(
        label="Phi (°)"
        , property-getter="parameters/signalPhi"
        , property-mutation="parameters/setSignalPhi"
        , :conversion-factor="180/Math.PI"
      )
    v-flex(sm3)
      v-switch.pa-2(label="Fiber Coupling")
    v-flex(sm3)
      v-text-field(
        type="number"
        , label="Waist Position"
        , suffix="um"
      )
        template(v-slot:prepend)
          v-icon(
          ) mdi-auto-fix
</template>

<script>
// import { mapGetters } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input'

export default {
  name: 'SignalSettings'
  , props: {
  }
  , data: () => ({
  })
  , components: {
    ParameterInput
  }
  , computed: {
  }
  , methods: {
  }
}
</script>
