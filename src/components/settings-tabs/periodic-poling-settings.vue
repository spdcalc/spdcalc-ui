<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(align-start, wrap)
    v-flex(xs12)
      ParameterActivator(
        label="Periodic Poling"
        , property-getter="parameters/periodicPolingEnabled"
        , property-mutation="parameters/setPeriodicPolingEnabled"
      )
    v-flex(xs12)
      ParameterInput(
        label="Period"
        , lazy
        , units="µm"
        , :sigfigs="2"
        , :min="0"
        , property-getter="parameters/polingPeriod"
        , property-mutation="parameters/setPolingPeriod"
        , auto-calc-getter="parameters/autoCalcPeriodicPoling"
        , auto-calc-mutation="parameters/setAutoCalcPeriodicPoling"
        , :disabled="!ppEnabled"
        , :display-override="!ppEnabled ? '∞' : invalidPP ? '(error)' : null"
        , :error="invalidPP"
      )
    v-flex(xs12)
      ParameterActivator(
        label="Apodization"
        , property-getter="parameters/apodizationEnabled"
        , property-mutation="parameters/setApodizationEnabled"
      )
    v-flex(xs12)
      ParameterSelector(
        property-getter="parameters/apodizationType"
        , property-mutation="parameters/setApodizationType"
        , items-getter="parameters/apodizationTypes"
        , tooltip="The apodization strategy (see: https://mathworld.wolfram.com/ApodizationFunction.html)"
        , :disabled="!ppEnabled || !apodizationEnabled"
      )
    v-flex(xs12, v-if="apodizationType === 'Gaussian'")
      ParameterInput(
        label="FWHM"
        , lazy
        , units="µm"
        , :min="0"
        , property-getter="parameters/apodizationFWHM"
        , property-mutation="parameters/setApodizationFWHM"
        , :disabled="!ppEnabled || !apodizationEnabled"
      )
    v-flex(xs12, v-if="apodizationType !== 'Gaussian' && apodizationType !== 'Interpolate'")
      ParameterInput(
        label="a"
        , lazy
        , :min="0"
        , :max="1"
        , property-getter="parameters/apodizationParam"
        , property-mutation="parameters/setApodizationParam"
        , :disabled="!ppEnabled || !apodizationEnabled"
      )
    v-flex(xs12, v-if="apodizationType === 'Interpolate'")
      v-dialog(v-model="apodizationDialog", width="500")
        template(v-slot:activator="{ on }")
          v-btn(
            v-on="on",
            block,
            dark,
            color="button"
            :disabled="!ppEnabled || !apodizationEnabled"
          )
            | {{ apodizationPointsLength }} points specified
        v-card
          v-card-title Apodization Points
          v-card-text
            v-textarea(
              :value="apodizationPoints"
              , @change="apodizationPoints = $event"
              , lazy
              , label="Apodization Points (comma-separated)"
              , outlined
            )
          v-card-actions
            v-btn(color="button", text, @click="apodizationDialog = false")
              | OK
</template>

<script>
// import { mapGetters, mapMutations } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import ParameterActivator from '@/components/inputs/parameter-activator.vue'

export default {
  name: 'PeriodicPolingSettings'
  , props: {
  }
  , data: () => ({
    apodizationDialog: false
  })
  , components: {
    ParameterInput
    , ParameterActivator
  }
  , computed: {
    ppEnabled(){
      return this.$store.getters['parameters/periodicPolingEnabled']
    }
    , apodizationType(){
      return this.$store.getters['parameters/apodizationType']
    }
    , apodizationPointsLength(){
      return this.$store.getters['parameters/apodizationPointsLength']
    }
    , apodizationEnabled(){
      return this.$store.getters['parameters/apodizationEnabled']
    }
    , invalidPP(){
      return this.$store.getters['parameters/polingPeriod'] <= 0
    }
    , apodizationPoints: {
      get(){
        return this.$store.getters['parameters/apodizationPoints'].join(', ')
      },
      set(value){
        const points = value.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x))
        this.$store.commit('parameters/setApodizationPoints', points)
      }
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
