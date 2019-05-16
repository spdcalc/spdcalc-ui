<template lang="pug">
v-app
  v-navigation-drawer(v-model="drawer", app, clipped, mobile-break-point="719")
    v-list(dense)
      v-list-tile(:to="{name: 'home'}")
        v-list-tile-action
          v-icon home
        v-list-tile-content
          v-list-tile-title Home
      v-list-tile(:to="{name: 'about'}")
        v-list-tile-action
          v-icon info
        v-list-tile-content
          v-list-tile-title About
  v-toolbar(dark, app, dense, clipped-left, :extension-height="extensionHeight")
    img.logo(src="@/assets/spdcalc-logo.png", alt="SPDCalc", height="32")

    v-spacer
    v-tooltip(bottom)
      template(v-slot:activator="{ on }")
        v-btn(v-on="on", flat, icon)
          v-icon(v-if="collapsed", @click="collapsed = false") mdi-plus-box
          v-icon(v-if="!collapsed", @click="collapsed = true") mdi-minus-box
      span Show / hide configuration menu

    template.extension(v-slot:extension, v-if="!collapsed")
      v-layout(align-start, fill-height)
        v-tabs(v-model="tab", color="transparent", :height="36")
          v-tab Crystal
          v-tab Pump
          v-tab Signal
          v-spacer
          v-bottom-sheet(v-model="helpOpen", hide-overlay, persistent)
            template(v-slot:activator)
              v-btn(icon, small)
                v-icon help
            v-toolbar
              v-toolbar-title Help about stuff
              v-spacer
              v-btn(icon, @click="helpOpen = false")
                v-icon close
            v-card
              v-card-text(height="200")
                h3 Theta
                p Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. The passage is attributed to an unknown typesetter in the 15th century who is thought to have scrambled parts of Cicero's De Finibus Bonorum et Malorum for use in a type specimen book.
                h3 Phi
                p Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. The passage is attributed to an unknown typesetter in the 15th century who is thought to have scrambled parts of Cicero's De Finibus Bonorum et Malorum for use in a type specimen book.
                h3 Length
                p Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. The passage is attributed to an unknown typesetter in the 15th century who is thought to have scrambled parts of Cicero's De Finibus Bonorum et Malorum for use in a type specimen book.

          v-tab-item(:transition="false", :reverse-transition="false")
            v-container.properties(fluid, grid-list-lg, px-0, py-3)
              v-layout(align-start)
                v-flex(sm3)
                  v-select(v-model="settings.crystal.crystalType", :items="crystalTypes", label="Crystal Type")
                v-flex(sm6)
                  v-sheet.crystal-info
                    .citation H. Vanherzeele, J. D. Bierlein, F. C. Zumsteg, Appl. Opt., 27, 3314 (1988)
                    a(href="http://google.com") more info
                v-flex(sm3)
                  v-select(v-model="settings.crystal.pmType", :items="pmTypes", label="Phasematch Type")
              v-layout(align-start)
                v-flex(sm3)
                  v-text-field(v-model="settings.crystal.theta", type="number", label="Theta", suffix="degrees")
                v-flex(sm3)
                  v-text-field(v-model="settings.crystal.phi", type="number", label="Phi", suffix="degrees")
                v-flex(sm3)
                  v-text-field(v-model="settings.crystal.length", type="number", label="Length", suffix="um")
                v-flex(sm3)
                  v-text-field(v-model="settings.crystal.temperature", type="number", label="Temperature", suffix="K")

          v-tab-item(:transition="false", :reverse-transition="false")
            v-flex(xs12)
              v-container(fluid, grid-list-lg, px-0, py-3)
                v-layout(align-start, fill-height)
                  v-flex(sm4)
                    v-text-field(v-model="settings.pump.wavelength", type="number", label="Wavelength", suffix="nm")
                    v-text-field(v-model="settings.pump.bandwidth", type="number", label="Bandwidth FWHM", suffix="nm")
                  v-flex(sm4)
                    v-text-field(v-model="settings.pump.waist", type="number", label="Waist 1/e^2", suffix="um")

          v-tab-item(:transition="false", :reverse-transition="false")
            v-container(fluid, grid-list-lg, px-0, py-3)
              v-layout(align-start, fill-height, wrap)
                v-flex(sm3)
                  v-text-field(v-model="settings.signal.wavelength", type="number", label="Wavelength", suffix="nm")
                  v-text-field(v-model="settings.signal.waist", type="number", label="Waist 1/e^2", suffix="um")
                v-flex(sm3)
                  v-text-field(v-model="settings.signal.theta", type="number", label="Theta", suffix="degrees")
                  v-text-field(v-model="settings.signal.phi", type="number", label="Phi", suffix="degrees")
                v-flex(sm3)
                  v-switch.pa-2(v-model="settings.signal.fiberCoupling", label="Fiber Coupling")
                v-flex(sm3)
                  v-sheet.pa-2(color="grey darken-3")
                    v-text-field(v-model="settings.signal.waistPosition", :disabled="settings.signal.autoWaistPosition", type="number", label="Waist Position", suffix="um")
                    v-checkbox(v-model="settings.signal.autoWaistPosition", label="Auto calculate")

  v-content
    v-toolbar-side-icon(@click.stop="drawer = !drawer")

    v-container(fluid)
      router-view
    v-footer(app, dark)
      span.white--text &copy; 2019 NIST
</template>

<script>
// import * as wasmTest from 'wasm-test/wasm_test_bg.wasm'

export default {
  name: 'App'
  , data: () => ({
    drawer: null
    , helpOpen: false
    , tab: null
    , collapsed: false
    , crystalTypes: [
      'BBO ref 1'
      , 'KTP ref 1'
    ]
    , pmTypes: [
      'Type 0: o -> o + o'
      , 'Type 0: e -> e + e'
      , 'Type 1: e -> o + o'
      , 'Type 2: e -> e + o'
      , 'Type 2: e -> o + e'
    ]
    , settings: {
      crystal: {
        crystalType: 'BBO ref 1'
        , pmType: 'Type 2: e -> e + o'
        , theta: 90
        , phi: 0
        , length: 2000
        , temperature: 20
      }
      , pump: {
        wavelength: 775
        , bandwidth: 5.35
        , waist: 100
      }
      , signal: {
        fiberCoupling: true
        , wavelength: 1550
        , theta: 0
        , phi: 0
        , waist: 100

        , autoWaistPosition: true
        , waistPosition: -563.63
      }
    }
  })
  , computed: {
    extensionHeight(){
      return this.collapsed ? 0 : 190
    }
  }
}
</script>

<style lang="sass" scoped>
.logo
  vertical-align: middle
.extension
  align-items: top

.container.properties
  .layout
    margin-top: -16px

    &:first-child
      margin-top: -8px
  .crystal-info
    padding: 6px
</style>
