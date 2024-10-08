<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(align-start, wrap)
    v-flex(sm12)
      ParameterSelector(
        property-getter="parameters/integratorMethod"
        , property-mutation="parameters/setIntegratorMethod"
        , items-getter="parameters/integratorMethods"
        , tooltip="The numerical integration method"
      )
    v-flex(sm12, v-if="method === 'Simpson'")
      ParameterInput(
        label="Steps"
        , lazy
        , property-getter="parameters/integratorSteps"
        , property-mutation="parameters/setIntegratorSteps"
        , step="1"
        , :min="5"
      )

    v-flex(xs6, v-if="method !== 'Simpson'")
      ParameterInput(
        label="Tol"
        , tooltip="The tolerance for integrator"
        , lazy
        , property-getter="parameters/integratorTolerance"
        , property-mutation="parameters/setIntegratorTolerance"
        , exponential
        , :sigfigs="0"
        , :min="1e-50"
        , :max="1e50"
      )
    v-flex(xs6, v-if="method !== 'Simpson'")
      ParameterInput(
        label="Max"
        , tooltip="The maximum depth for the integrator"
        , lazy
        , property-getter="parameters/integratorMaxDepth"
        , property-mutation="parameters/setIntegratorMaxDepth"
        , :min="10"
        , :step="1"
      )
    v-flex(xs6, v-if="method === 'GaussLegendre'")
      ParameterInput(
        label="Degree"
        , tooltip="Degree of the Gauss-Legendre quadrature"
        , lazy
        , property-getter="parameters/integratorDegree"
        , property-mutation="parameters/setIntegratorDegree"
        , :min="2"
        , :step="1"
      )

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
          , :display-only="autoCalcIntegrationLimits"
        )
        .dash &mdash;
        ParameterInput(
          units="nm"
          , lazy
          , :sigfigs="2"
          , property-getter="parameters/integrationXMax"
          , property-mutation="parameters/setIntegrationXMax"
          , :display-only="autoCalcIntegrationLimits"
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
          , :display-only="autoCalcIntegrationLimits"
        )
        .dash &mdash;
        ParameterInput(
          units="nm"
          , lazy
          , :sigfigs="2"
          , property-getter="parameters/integrationYMax"
          , property-mutation="parameters/setIntegrationYMax"
          , :display-only="autoCalcIntegrationLimits"
        )
</template>

<script>
import { mapGetters } from "vuex";
import ParameterInput from "@/components/inputs/parameter-input.vue";
import ParameterActivator from "@/components/inputs/parameter-activator.vue";

export default {
  name: "IntegrationSettings",
  props: {},
  data: () => ({}),
  components: {
    ParameterInput,
    ParameterActivator,
  },
  computed: {
    method() {
      return this.$store.getters["parameters/integratorMethod"];
    },
    ...mapGetters("parameters", ["autoCalcIntegrationLimits"]),
  },
  methods: {},
};
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
