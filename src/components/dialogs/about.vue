<template lang="pug">
v-dialog(v-model="isOpen", fullscreen, hide-overlay, transition="dialog-bottom-transition")
  v-card
    v-toolbar(dark, flat, color="navbar")
      v-toolbar-title
        span SPDCalc (build: {{ buildVersion }})
      v-spacer
      v-btn(icon, @click="isOpen = false")
        v-icon mdi-close
    v-card-text
      .content
        p.
          SPDCalc is a fast design tool for spontaneous parametric downconversion sources.
        p.
          The process of spontaneous parametric downconversion is an important source
          of single-photons and quantum states of light. Much recent theoretical and
          experimental work focuses on engineering the properties of the photons
          emitted from downconversion. For multi-photon experiments generating photon
          pairs that are spectrally pure, meaning the signal and idler photons are
          uncorrelated, has been an active area of investigation. For fundamental
          tests of quantum mechanics, such as loop-hole-free Bell tests, optimizing
          the coupling of photons to single-mode fiber is an important consideration.
        p.
          While the principles behind the nonlinear process of downconversion are well
          understood, calculating the properties of the photons can be difficult and
          time-consuming when considering photons emitted at an angle with respect
          to the pump (non collinear) when the signal, idler, and pump can experience
          birefringent walk off. Here we present a library designed to simplify these
          calculations that builds on previous work. The library allows
          a user to easily determine the phasematching properties as well as the emission
          characteristics and joint spectrum of the signal and idler photons. The library
          also allows a user to quickly find phasematching parameters that generate
          spectrally pure states. The Hong-Ou-Mandel dip between the signal and idler
          is also calculated, and the joint spectrum in the dip can also be easily
          examined. Finally, the spatial mode structure and single-mode fiber coupling
          efficiency can be computed. The library is designed to be flexible, and can
          handle periodically-poled crystals that have been apodized with a Gaussian
          function.
        p.
          This website is a GUI version of the library available at
          <a href="https://github.com/kshalm/spdcalc" target="__blank">github.com/kshalm/spdcalc</a>.
          Please log any bugs or feature requests there.
      v-btn(close, @click="isOpen = false", outlined, color="primary") Back to SPDCalc
</template>

<script>
export default {
  name: "AboutDialog",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    buildVersion: VITE_SPDCALC_BUILD_VERSION,
  }),
  components: {},
  computed: {
    isOpen: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
  },
  methods: {},
};
</script>

<style lang="sass">
.content
  max-width: 600px
  color: map-get($flat-ui, 'midnight-blue')
  font-size: 16px
  line-height: 1.4
  margin: 1rem 0
</style>
