<template lang="pug">
v-container.properties(fluid, grid-list-lg, px-0, py-4, fill-height)
  v-layout
    v-flex(sm4)
      ParameterInput(
        label="Wavelength"
        , units="nm"
        , property-getter="parameters/pumpWavelength"
        , property-mutation="parameters/setPumpWavelength"
      )
    v-flex(sm4)
      ParameterInput(
        label="Bandwidth FWHM"
        , units="nm"
        , property-getter="parameters/pumpBandwidth"
        , property-mutation="parameters/setPumpBandwidth"
      )
    v-flex(sm4)
      ParameterInput(
        label="Waist 1/e²"
        , units="µm"
        , property-getter="parameters/pumpWaist"
        , property-mutation="parameters/setPumpWaist"
      )
</template>

<script>
// import { mapGetters } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input'

export default {
  name: 'PumpSettings'
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
