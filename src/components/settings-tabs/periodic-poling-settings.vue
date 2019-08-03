<template lang="pug">
v-container(fluid)
  v-layout(align-start, wrap)
    v-flex(xs12)
      v-switch.mt-0(v-model="ppEnabled", label="Periodic Poling", color="primary")
    v-flex(xs12)
      ParameterInput(
        label="Period"
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
        label="FWHM"
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

<style lang="sass">
.test
  color: white
  font-size: 14px
  .v-input
    font-size: 14px
    &.v-text-field--outlined
      fieldset
        border-color: transparent
      &:hover fieldset, &.v-input--is-focused fieldset
        border-color: inherit
      & > .v-input__control > .v-input__slot
        min-height: 32px
    .v-text-field__details
      display: none
</style>
