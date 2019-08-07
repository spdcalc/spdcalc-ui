<template lang="pug">
v-container(fluid)
  v-layout(align-start, wrap)
    v-flex(sm12)
      ParameterInput(
        label="Grid Size (resolution)"
        , property-getter="parameters/integrationGridSize"
        , property-mutation="parameters/setIntegrationGridSize"
        , step="100"
      )
    v-flex(sm12)
      ParameterActivator(
        label="Auto Calculate"
        , property-getter="parameters/autoCalcIntegrationLimits"
        , property-mutation="parameters/setAutoCalcIntegrationLimits"
        , tooltip="Automatically update integration limits to something useful"
      )
    v-flex(sm12)
      v-subheader.subheader.px-0 Signal Range
      .range
        ParameterInput(
          left
          , property-getter="parameters/integrationXMin"
          , property-mutation="parameters/setIntegrationXMin"
          , :disabled="autoCalcIntegrationLimits"
        )
        .dash &mdash;
        ParameterInput(
          units="nm"
          , property-getter="parameters/integrationXMax"
          , property-mutation="parameters/setIntegrationXMax"
          , :disabled="autoCalcIntegrationLimits"
        )
    v-flex(sm12)
      v-subheader.subheader.px-0 Idler Range
      .range
        ParameterInput(
          left
          , property-getter="parameters/integrationXMin"
          , property-mutation="parameters/setIntegrationXMin"
          , :disabled="autoCalcIntegrationLimits"
        )
        .dash &mdash;
        ParameterInput(
          units="nm"
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
  height: 36px
.range
  display: flex
  > *
    flex: 1
  .dash
    flex: none
    font-size: 14px
    padding: 6px
</style>
