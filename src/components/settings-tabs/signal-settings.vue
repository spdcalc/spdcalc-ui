<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(wrap)
    v-flex(md12, sm6, xs12)
      ParameterInput(
        label="Wavelength"
        , lazy
        , units="nm"
        , :sigfigs="2"
        , property-getter="parameters/signalWavelength"
        , property-mutation="parameters/setSignalWavelength"
      )
    v-flex(md12, sm6, xs12)
      ParameterInput(
        label="Waist 1/e²"
        , lazy
        , units="µm"
        , property-getter="parameters/signalWaist"
        , property-mutation="parameters/setSignalWaist"
      )
    v-flex(xs6)
      ParameterInput(
        label="θ"
        , lazy
        , units="°"
        , property-getter="parameters/signalTheta"
        , property-mutation="parameters/setSignalTheta"
      )
    v-flex(xs6)
      ParameterInput(
        label="ϕ"
        , lazy
        , units="°"
        , property-getter="parameters/signalPhi"
        , property-mutation="parameters/setSignalPhi"
      )
    v-flex(md12, sm3, xs12)
      ParameterInput(
        label="Signal Focus"
        , lazy
        , units="µm"
        , :disabled="true"
        , :sigfigs="2"
        , property-getter="parameters/signalWaistPosition"
        , tooltip="The focal point of the signal along the z-axis from the end of the crystal"
      )
    v-flex(md12, sm3, xs12)
      ParameterInput(
        label="Idler Focus"
        , lazy
        , units="µm"
        , :disabled="true"
        , :sigfigs="2"
        , property-getter="parameters/idlerWaistPosition"
        , tooltip="The focal point of the idler along the z-axis from the end of the crystal"
      )
    //- v-flex(xs12)
    //-   v-text-field(
    //-     type="number"
    //-     , label="Waist Position"
    //-     , suffix="um"
    //-   )
    //-     template(v-slot:prepend)
    //-       v-icon(
    //-       ) mdi-auto-fix
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
    fiberCoupling: {
      get(){ return this.$store.getters['parameters/fiberCoupling'] }
      , set( val ){ this.$store.commit('parameters/setFiberCoupling', val) }
    }
  }
  , methods: {
  }
}
</script>
