<template lang="pug">
v-container(fluid)
  v-layout(align-start, wrap)
    v-flex(sm12)
      v-switch(label="Auto Calculate", color="primary")
    v-flex(sm12)
      ParameterInput(
        label="Grid Size (resolution)"
        , property-getter="parameters/integrationGridSize"
        , property-mutation="parameters/setIntegrationGridSize"
        , step="100"
      )
    v-flex(sm12)
      ParameterInput(
        label="Signal Start"
        , units="nm"
        , property-getter="parameters/integrationXMin"
        , property-mutation="parameters/setIntegrationXMin"
      )
    v-flex(sm12)
      ParameterInput(
        label="Signal End"
        , units="nm"
        , property-getter="parameters/integrationXMax"
        , property-mutation="parameters/setIntegrationXMax"
      )
    v-flex(sm12)
      ParameterInput(
        label="Idler Start"
        , units="nm"
        , property-getter="parameters/integrationXMin"
        , property-mutation="parameters/setIntegrationXMin"
      )
    v-flex(sm12)
      ParameterInput(
        label="Idler End"
        , units="nm"
        , property-getter="parameters/integrationYMin"
        , property-mutation="parameters/setIntegrationYMin"
      )
</template>

<script>
// import { mapGetters } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input'

export default {
  name: 'IntegrationSettings'
  , props: {
  }
  , data: () => ({
  })
  , components: {
    ParameterInput
  }
  , computed: {
  }
  , methods: {
  }
}
</script>
