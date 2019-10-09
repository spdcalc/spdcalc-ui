<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(wrap)
    v-flex(md12, sm6, xs12)
      ParameterInput(
        label="Wavelength"
        , units="nm"
        , property-getter="parameters/signalWavelength"
        , property-mutation="parameters/setSignalWavelength"
      )
    v-flex(md12, sm6, xs12)
      ParameterInput(
        label="Waist 1/e²"
        , units="µm"
        , property-getter="parameters/signalWaist"
        , property-mutation="parameters/setSignalWaist"
      )
    v-flex(md12, sm3, xs12)
      ParameterInput(
        label="Waist Position"
        , units="µm"
        , property-getter="parameters/signalCollectionFocus"
        , property-mutation="parameters/setSignalCollectionFocus"
        , tooltip="The focal point of the signal along the z-axis"
      )
    v-flex(xs6)
      ParameterInput(
        label="θ"
        , units="°"
        , property-getter="parameters/signalTheta"
        , property-mutation="parameters/setSignalTheta"
      )
    v-flex(xs6)
      ParameterInput(
        label="ϕ"
        , units="°"
        , property-getter="parameters/signalPhi"
        , property-mutation="parameters/setSignalPhi"
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
