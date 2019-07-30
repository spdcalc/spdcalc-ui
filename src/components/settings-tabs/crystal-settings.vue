<template lang="pug">
v-container(fluid, grid-list-lg, px-0, pt-5, pb-0)
  v-layout(align-start, wrap)
    v-flex(xs12, sm8)
      v-layout(align-start, wrap)
        v-flex(xs12, sm6)
          PmTypeSelector
        v-flex(xs12, sm6)
          CrystalSelector
        v-flex(xs12, sm3)
          ParameterInput(
            label="Theta (°)"
            , property-getter="parameters/crystalTheta"
            , property-mutation="parameters/setCrystalTheta"
            , auto-calc-getter="parameters/autoCalcTheta"
            , auto-calc-mutation="parameters/setAutocalcTheta"
          )
        v-flex(xs12, sm3)
          ParameterInput(
            label="Phi (°)"
            , property-getter="parameters/crystalPhi"
            , property-mutation="parameters/setCrystalPhi"
          )
        v-flex(xs12, sm3)
          ParameterInput(
            label="Length"
            , units="µm"
            , property-getter="parameters/crystalLength"
            , property-mutation="parameters/setCrystalLength"
          )
        v-flex(xs12, sm3)
          ParameterInput(
            label="Temperature"
            , units="°C"
            , property-getter="parameters/crystalTemperature"
            , property-mutation="parameters/setCrystalTemperature"
          )
    v-flex(xs12, sm4)
      v-sheet.crystal-info
        .name {{ crystalMeta.name }}
        .axis Axis Type: {{ crystalMeta.axis_type | startCase }}
        .point-group Point Group: {{ crystalMeta.point_group }}
        a(v-if="crystalMeta.reference_url", :href="crystalMeta.reference_url", target="_blank") more info
</template>

<script>
import { mapGetters } from 'vuex'
import CrystalSelector from '@/components/inputs/crystal-selector'
import PmTypeSelector from '@/components/inputs/pmtype-selector'
import ParameterInput from '@/components/inputs/parameter-input'

export default {
  name: 'CrystalSettings'
  , props: {
  }
  , data: () => ({
  })
  , components: {
    CrystalSelector
    , PmTypeSelector
    , ParameterInput
  }
  , computed: {
    ...mapGetters('parameters', {
      ppEnabled: 'periodicPolingEnabled'
      , crystalMeta: 'crystalMeta'
    })
  }
  , methods: {
  }
}
</script>
