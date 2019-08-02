<template lang="pug">
v-container(fluid)
  v-layout(align-start, wrap)
    v-flex(xs12)
      v-switch.mt-0(v-model="ppEnabled", label="Periodic Poling", color="primary")
    v-flex(xs12)
      ParameterInput(
        label="Poling Period"
        , units="µm"
        , property-getter="parameters/polingPeriod"
        , property-mutation="parameters/setPolingPeriod"
        , auto-calc-getter="parameters/autoCalcPeriodicPoling"
        , auto-calc-mutation="parameters/setAutoCalcPeriodicPoling"
        , :disabled="!ppEnabled"
        , :display-override="!ppEnabled ? '∞' : invalidPP ? '(error)' : null"
        , :error="invalidPP"
      )
    v-flex(xs12)
      v-switch.mt-0(v-model="apodizationEnabled", label="Apodization", color="primary", :disabled="!ppEnabled")
    v-flex(xs12)
      ParameterInput(
        label="Apodization FWHM"
        , units="µm"
        , property-getter="parameters/apodizationFWHM"
        , property-mutation="parameters/setPolingPeriod"
        , :disabled="!ppEnabled || !apodizationEnabled"
      )
</template>

<script>
// import { mapGetters, mapMutations } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input'

export default {
  name: 'PeriodicPolingSettings'
  , props: {
  }
  , data: () => ({
  })
  , components: {
    ParameterInput
  }
  , computed: {
    ppEnabled: {
      get(){ return this.$store.getters['parameters/periodicPolingEnabled'] }
      , set( val ){ this.$store.commit('parameters/setPeriodicPolingEnabled', val) }
    }
    , apodizationEnabled: {
      get(){ return this.$store.getters['parameters/apodizationEnabled'] }
      , set( val ){ this.$store.commit('parameters/setApodizationEnabled', val) }
    }
    , invalidPP(){
      return this.$store.getters['parameters/polingPeriod'] <= 0
    }
  }
  , methods: {
  }
}
</script>
