<template lang="pug">
v-container(fluid)
  v-layout(wrap)
    v-flex(xs12)
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
    v-flex(xs12)
      v-layout(align-start)
        v-flex.pr-1(xs6)
          ParameterInput(
            label="θ"
            , units="°"
            , property-getter="parameters/signalTheta"
            , property-mutation="parameters/setSignalTheta"
          )
        v-flex.pl-1(xs6)
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
