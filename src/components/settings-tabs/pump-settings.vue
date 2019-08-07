<template lang="pug">
v-container(fluid)
  v-layout(wrap)
    v-flex(xs12)
      ParameterInput(
        label="Wavelength"
        , units="nm"
        , property-getter="parameters/pumpWavelength"
        , property-mutation="parameters/setPumpWavelength"
      )
    v-flex(xs12)
      v-subheader.subheader.px-0 Bandwidth
      ParameterInput(
        label="FWHM"
        , units="nm"
        , property-getter="parameters/pumpBandwidth"
        , property-mutation="parameters/setPumpBandwidth"
      )
    v-flex(xs12)
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

<style lang="sass" scoped>
.subheader
  justify-content: center
  height: 36px
</style>
