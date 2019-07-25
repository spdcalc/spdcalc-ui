<template lang="pug">
v-container(fluid, grid-list-lg, pt-5, pb-0)
  v-layout(align-start)
    v-flex(sm3)
      v-switch(v-model="ppEnabled", label="Enable Periodic Poling", color="primary")
    v-flex(sm3)
      ParameterInput(
        label="Poling Period"
        , property-getter="parameters/polingPeriod"
        , property-mutation="parameters/setPolingPeriod"
        , auto-calc-getter="parameters/autoCalcPeriodicPoling"
        , auto-calc-mutation="parameters/setAutoCalcPeriodicPoling"
        , :disabled="!ppEnabled"
      )
  v-layout(align-start)
    v-flex(sm3)
      v-switch.pt-3(
        v-model="periodicPoling.apodizationEnabled"
        , label="Enable Apodization"
        , :disabled="!ppEnabled"
        , color="primary"
      )
    v-flex(sm3)
      v-text-field(
        v-model="periodicPoling.apodizationFWHM"
        , type="number"
        , label="Apodization FWHM"
        , suffix="um"
        , :disabled="!periodicPoling.apodizationEnabled"
        , :required="!ppEnabled || !periodicPoling.apodizationEnabled"
      )
    v-flex(sm3)
      v-text-field(
        v-model="periodicPoling.apodizationFWHM"
        , type="number"
        , label="Apodization Steps"
        , :disabled="!periodicPoling.apodizationEnabled"
        , :required="!ppEnabled || !periodicPoling.apodizationEnabled"
      )
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input'

export default {
  name: 'PeriodicPolingSettings'
  , props: {
  }
  , data: () => ({
    periodicPoling: {
      enabled: false
      , autoCalcPeriod: false
    }
  })
  , components: {
    ParameterInput
  }
  , computed: {
    ppEnabled: {
      get(){ return this.$store.getters['parameters/periodicPolingEnabled'] }
      , set( val ){ this.$store.commit('parameters/setPeriodicPolingEnabled', val) }
    }
  }
  , methods: {
  }
}
</script>
