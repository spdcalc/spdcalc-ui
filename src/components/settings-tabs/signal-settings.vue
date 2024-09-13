<template lang="pug">
v-container(fluid, grid-list-sm)
  v-layout(wrap)
    v-flex(xs12)
      //- Activator for counter propagation
      ParameterActivator(
        label="Counter Propagation"
        , property-getter="parameters/counterPropagation"
        , property-mutation="parameters/setCounterPropagation"
      )
      ParameterInput(
        label="Wavelength"
        , lazy
        , units="nm"
        , :sigfigs="2"
        , :min="$store.getters['parameters/pumpWavelength']"
        , property-getter="parameters/signalWavelength"
        , property-mutation="parameters/setSignalWavelength"
      )
    v-flex(xs12)
      ParameterInput(
        label="Waist 1/e²"
        , lazy
        , units="µm"
        , :min="0"
        , :warningMsg="signalWaist < minSignalWaistSize ? waistSizeWarning : undefined"
        , property-getter="parameters/signalWaist"
        , property-mutation="parameters/setSignalWaist"
      )
    v-flex(xs6)
      ParameterInput(
        label="θ"
        , lazy
        , units="°"
        , property-getter="parameters/signalTheta"
        , property-mutation="parameters/setSignalTheta"
        , :warningMsg="signalTheta < 10 || signalTheta > 170 ? undefined: 'Warning: The phasematching algorithms use a small-angle approximation for signal and idler θ'"
        , tooltip="The signal azimuthal angle (-180°, 180°]"
        , :min="-180"
        , :max="180"
      )
    v-flex(xs6)
      ParameterInput(
        label="ϕ"
        , disabled
        , lazy
        , units="°"
        , property-getter="parameters/signalPhi"
        , property-mutation="parameters/setSignalPhi"
        , tooltip="The signal polar angle [0°, 360°)"
        , :min="0"
        , :max="360"
      )
    v-flex(xs12)
      ParameterInput(
        label="Signal Focus"
        , lazy
        , units="µm"
        , :sigfigs="2"
        , property-getter="parameters/signalWaistPosition"
        , property-mutation="parameters/setSignalWaistPosition"
        , auto-calc-getter="parameters/autoCalcSignalWaistPosition"
        , auto-calc-mutation="parameters/setAutoCalcSignalWaistPosition"
        , tooltip="The focal point of the signal along the z-axis from the end of the crystal"
      )
    v-flex(xs12)
      ParameterInput(
        label="Idler Focus"
        , lazy
        , units="µm"
        , :sigfigs="2"
        , property-getter="parameters/idlerWaistPosition"
        , property-mutation="parameters/setIdlerWaistPosition"
        , auto-calc-getter="parameters/autoCalcIdlerWaistPosition"
        , auto-calc-mutation="parameters/setAutoCalcIdlerWaistPosition"
        , tooltip="The focal point of the idler along the z-axis from the end of the crystal"
      )
    v-flex(xs6)
      ParameterInput(
        label="ns"
        , lazy
        , disabled
        , property-getter="parameters/signalRIndex"
        , tooltip="The index of refraction of the signal"
        , :min="1"
      )
    v-flex(xs6)
      ParameterInput(
        label="ni"
        , lazy
        , disabled
        , property-getter="parameters/idlerRIndex"
        , tooltip="The index of refraction of the idler"
        , :min="1"
      )
    v-flex(xs12)
      v-subheader.subheader.py-0 Optimum Idler
    v-flex(xs12)
      ParameterInput(
        label="Wavelength"
        , lazy
        , units="nm"
        , :sigfigs="2"
        , display-only
        , :value="optimumIdler.wavelength"
      )
    v-flex(xs6)
      ParameterInput(
        label="θ"
        , lazy
        , units="°"
        , display-only
        , :value="optimumIdler.theta"
      )
    v-flex(xs6)
      ParameterInput(
        label="ϕ"
        , lazy
        , units="°"
        , display-only
        , :value="optimumIdler.phi"
      )
</template>

<script>
import { mapGetters } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import { waistSizeWarning } from '@/text'

export default {
  name: 'SignalSettings',
  props: {},
  data: () => ({
    waistSizeWarning,
  }),
  components: {
    ParameterInput,
  },
  computed: {
    fiberCoupling: {
      get() {
        return this.$store.getters['parameters/fiberCoupling']
      },
      set(val) {
        this.$store.commit('parameters/setFiberCoupling', val)
      },
    },
    signalTheta() {
      return this.$store.getters['parameters/signalTheta']
    },
    ...mapGetters('parameters', [
      'minSignalWaistSize',
      'signalWaist',
      'optimumIdler',
    ]),
  },
  methods: {},
}
</script>

<style lang="sass">
.subheader
  justify-content: center
  height: 32px
</style>
