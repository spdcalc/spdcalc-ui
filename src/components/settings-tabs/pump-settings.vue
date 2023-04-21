<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(wrap)
    v-flex(xs12)
      ParameterInput(
        label="Power"
        , lazy
        , units="mW"
        , :min="0"
        , property-getter="parameters/pumpPower"
        , property-mutation="parameters/setPumpPower"
      )
    v-flex(xs12)
      ParameterInput(
        label="Wavelength"
        , lazy
        , units="nm"
        , :max="$store.getters['parameters/signalWavelength']"
        , property-getter="parameters/pumpWavelength"
        , property-mutation="parameters/setPumpWavelength"
      )
    v-flex(xs12)
      ParameterInput(
        label="Bandwidth FWHM"
        , lazy
        , units="nm"
        , :min="1e-6"
        , property-getter="parameters/pumpBandwidth"
        , property-mutation="parameters/setPumpBandwidth"
      )
    v-flex(xs12)
      ParameterInput(
        label="Waist 1/e²"
        , lazy
        , :min="0"
        , units="µm"
        , :warningMsg="pumpWaist < minPumpWaistSize ? waistSizeWarning : undefined"
        , property-getter="parameters/pumpWaist"
        , property-mutation="parameters/setPumpWaist"
      )
    v-flex(xs12)
      ParameterInput(
        label="Spectrum cutoff"
        , lazy
        , property-getter="parameters/pumpSpectrumThreshold"
        , property-mutation="parameters/setPumpSpectrumThreshold"
        , tooltip="If the pump spectrum is below this value the JSI will be assumed to be zero (speeds up calculation)"
        , exponential
        , :sigfigs="0"
      )
    v-flex(xs12)
      //- pump refractive index
      ParameterInput(
        label="np"
        , lazy
        , disabled
        , property-getter="parameters/pumpRIndex"
        , tooltip="The refractive index of the pump"
      )
</template>

<script>
import { mapGetters } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import { waistSizeWarning } from '@/text'

export default {
  name: 'PumpSettings'
  , props: {
  }
  , data: () => ({
    waistSizeWarning
  })
  , components: {
    ParameterInput
  }
  , computed: {
    ...mapGetters('parameters', [
      'minPumpWaistSize'
      , 'pumpWaist'
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
</style>
