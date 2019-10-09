<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(align-start, wrap)
    v-flex(md12, sm6, xs12)
      ParameterActivator(
        label="Periodic Poling"
        , property-getter="parameters/periodicPolingEnabled"
        , property-mutation="parameters/setPeriodicPolingEnabled"
      )
    v-flex(md12, sm6, xs12)
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
    v-flex(md12, sm6, xs12)
      ParameterActivator(
        label="Apodization"
        , property-getter="parameters/apodizationEnabled"
        , property-mutation="parameters/setApodizationEnabled"
      )
    v-flex(md12, sm6, xs12)
      ParameterInput(
        label="FWHM"
        , units="µm"
        , property-getter="parameters/apodizationFWHM"
        , property-mutation="parameters/setApodizationFWHM"
        , :disabled="!ppEnabled || !apodizationEnabled"
      )
</template>

<script>
// import { mapGetters, mapMutations } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input'
import ParameterActivator from '@/components/inputs/parameter-activator'

export default {
  name: 'PeriodicPolingSettings'
  , props: {
  }
  , data: () => ({
  })
  , components: {
    ParameterInput
    , ParameterActivator
  }
  , computed: {
    ppEnabled(){
      return this.$store.getters['parameters/periodicPolingEnabled']
    }
    , apodizationEnabled(){
      return this.$store.getters['parameters/apodizationEnabled']
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
