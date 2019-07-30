<template lang="pug">
v-container(fluid, grid-list-lg, pt-5, pb-0)
  v-layout(align-start)
    v-flex(sm3)
      v-switch(v-model="ppEnabled", label="Enable Periodic Poling", color="primary")
    v-flex(sm3)
      ParameterInput(
        label="Poling Period"
        , units="µm"
        , property-getter="parameters/polingPeriod"
        , property-mutation="parameters/setPolingPeriod"
        , auto-calc-getter="parameters/autoCalcPeriodicPoling"
        , auto-calc-mutation="parameters/setAutoCalcPeriodicPoling"
        , :disabled="!ppEnabled"
      )
  v-layout(align-start)
    v-flex(sm3)
      v-switch(v-model="apodizationEnabled", label="Enable Apodization", color="primary", :disabled="!ppEnabled")
    v-flex(sm3)
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
  }
  , methods: {
  }
}
</script>
