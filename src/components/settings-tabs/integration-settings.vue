<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(align-start, wrap)
    v-flex(sm12)
      ParameterInput(
        label="Grid Size (resolution)"
        , lazy
        , property-getter="parameters/integrationGridSize"
        , property-mutation="parameters/setIntegrationGridSize"
        , step="100"
        , :min="1"
      )
    v-flex(sm12)
      ParameterActivator(
        label="Auto Calculate"
        , property-getter="parameters/autoCalcIntegrationLimits"
        , property-mutation="parameters/setAutoCalcIntegrationLimits"
        , tooltip="Automatically update integration limits to something useful"
      )
    v-flex(sm12)
      v-subheader.subheader.py-0 Signal Range
    v-flex(sm12)
      .range
        ParameterInput(
          left
          , lazy
          , units="nm"
          , :sigfigs="2"
          , :min="0"
          , property-getter="parameters/integrationXMin"
          , property-mutation="parameters/setIntegrationXMin"
          , :disabled="autoCalcIntegrationLimits"
        )
        .dash &mdash;
        ParameterInput(
          units="nm"
          , lazy
          , :sigfigs="2"
          , property-getter="parameters/integrationXMax"
          , property-mutation="parameters/setIntegrationXMax"
          , :disabled="autoCalcIntegrationLimits"
        )
    v-flex(sm12)
      v-subheader.subheader.py-0 Idler Range
    v-flex(sm12)
      .range
        ParameterInput(
          left
          , lazy
          , units="nm"
          , :sigfigs="2"
          , :min="0"
          , property-getter="parameters/integrationYMin"
          , property-mutation="parameters/setIntegrationYMin"
          , :disabled="autoCalcIntegrationLimits"
        )
        .dash &mdash;
        ParameterInput(
          units="nm"
          , lazy
          , :sigfigs="2"
          , property-getter="parameters/integrationYMax"
          , property-mutation="parameters/setIntegrationYMax"
          , :disabled="autoCalcIntegrationLimits"
        )
</template>

<script>
import { mapGetters } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input'
import ParameterActivator from '@/components/inputs/parameter-activator'

export default {
  name: 'IntegrationSettings'
  , props: {
  }
  , data: () => ({
  })
  , components: {
    ParameterInput
    , ParameterActivator
  }
  , computed: {
    ...mapGetters('parameters', [
      'autoCalcIntegrationLimits'
    ])
  }
  , methods: {
  }
}
</script>

<style lang="sass" scoped>
.subheader
  justify-content: center
  height: 32px
.range
  display: flex
  > *
    flex: 1
  .dash
    flex: none
    font-size: 14px
    padding: 6px
</style>
