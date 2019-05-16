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
  v-toolbar(dark, app, clipped-left, :extension-height="extensionHeight")
    img.logo(src="@/assets/spdcalc-logo.png", alt="SPDCalc", height="32")

    v-spacer
    v-btn(flat, icon, color="blue", )
      v-icon(v-if="collapsed", @click="collapsed = false") settings
      v-icon(v-if="!collapsed", @click="collapsed = true") close

    template.extension(v-slot:extension, v-if="!collapsed")
      v-container(fluid, grid-list-lg, pa-0, fill-height)
        v-layout(align-start)
          v-flex(sm3)
            v-item-group(v-model="tab", mandatory)
              v-list.transparent(dense)
                v-item
                  v-list-tile(
                    slot-scope="{ active, toggle }"
                    , :class="{ 'blue accent-2': active }"
                    , @click="toggle(0)"
                  )
                    v-list-tile-content
                      v-list-tile-title Crystal
                v-item
                  v-list-tile(
                    slot-scope="{ active, toggle }"
                    , :class="{ 'blue accent-2': active }"
                    , @click="toggle(1)"
                  )
                    v-list-tile-content
                      v-list-tile-title Pump
                v-item
                  v-list-tile(
                    slot-scope="{ active, toggle }"
                    , :class="{ 'blue accent-2': active }"
                    , @click="toggle(2)"
                  )
                    v-list-tile-content
                      v-list-tile-title Signal
          v-flex(xs9)
            v-window(v-model="tab")
              v-window-item(key="crystal", :transition="false", :reverse-transition="false")
                v-container(fluid, grid-list-lg, pa-0)
                  v-layout(align-start, fill-height)
                    v-flex(sm4)
                      v-select(v-model="settings.crystal.crystalType", :items="crystalTypes", label="Crystal Type")
                      v-select(v-model="settings.crystal.pmType", :items="pmTypes", label="Phasematch Type")
                    v-flex(sm4)
                      v-text-field(v-model="settings.crystal.theta", type="number", label="Theta", suffix="degrees")
                      v-text-field(v-model="settings.crystal.phi", type="number", label="Phi", suffix="degrees")
                    v-flex(sm4)
                      v-text-field(v-model="settings.crystal.length", type="number", label="Length", suffix="um")
                      v-text-field(v-model="settings.crystal.temperature", type="number", label="Temperature", suffix="K")

              v-window-item(key="pump", :transition="false", :reverse-transition="false")
                v-flex(xs12)
                  v-container(fluid, grid-list-lg, pa-0)
                    v-layout(align-start, fill-height)
                      v-flex(sm4)
                        v-text-field(v-model="settings.pump.wavelength", type="number", label="Wavelength", suffix="nm")
                        v-text-field(v-model="settings.pump.bandwidth", type="number", label="Bandwidth FWHM", suffix="nm")
                      v-flex(sm4)
                        v-text-field(v-model="settings.pump.waist", type="number", label="Waist 1/e^2", suffix="um")

              v-window-item(key="signal", :transition="false", :reverse-transition="false")
                v-container(fluid, grid-list-lg, pa-0)
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
      return this.collapsed ? 0 : 170
    }
  }
}
</script>

<style lang="sass" scoped>
.logo
  vertical-align: middle
.extension
  align-items: top
</style>
