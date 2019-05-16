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
    v-toolbar-items
      v-combobox(
        label="(no preset)"
        , v-model="session.presets.selected"
        , :items="session.presets.list"
        , :search-input.sync="session.presets.name"
        , :hide-no-data="!session.presets.name"
        , solo
        , flat
        , dark
        , @keypress.enter="newPreset()"
      )
        template(v-slot:no-data)
          v-list-tile(@click="newPreset()", ripple)
            v-list-tile-action
              v-icon add
            v-list-tile-content
              v-list-tile-title
                | Create
                | &nbsp;
                span {{ session.presets.name }}
        template(v-slot:item="{ index, item }")
          v-list-tile-content
            v-text-field(v-if="editingPreset === item", v-model="editingPreset", autofocus, flat, background-color="transparent", hide-details, solo, @keyup.enter="editPreset(index, item)")
            span(v-else) {{ item }}
          v-spacer
          v-list-tile-action(@click.stop)
            v-btn(icon, @click.stop.prevent="editPreset(index, item)")
              v-icon {{ editingPreset !== item ? &apos;edit&apos; : &apos;check&apos; }}

      //- v-select(
      //-   label="(no preset)"
      //-   , v-model="session.presets.selected"
      //-   , :items="session.presets.list"
      //-   , solo
      //-   , flat
      //-   , dark
      //- )
      //-   template(v-slot:prepend-item)
      //-     v-list-tile(
      //-       @click="newPreset()"
      //-       , ripple
      //-     )
      //-       v-list-tile-action
      //-         v-icon add
      //-       v-list-tile-content
      //-         v-list-tile-title
      //-           span New Preset
      //-     v-divider.mt-2
      v-toolbar-items
        v-btn(color="success", flat) save
        v-btn(icon, flat)
          v-icon more_vert


    template(v-slot:extension)
      .extension
        v-container(fluid, pa-0)
          v-layout(align-start)
            v-tabs(v-model="tab", color="transparent", :height="36", :hide-slider="collapsed", :mandatory="!collapsed")
              v-tab(@click.capture="collapsed = false") Crystal
              v-tab(@click.capture="collapsed = false") Periodic Poling
              v-tab(@click.capture="collapsed = false") Pump
              v-tab(@click.capture="collapsed = false") Signal
              v-tab(@click.capture="collapsed = false") Filters
              v-tab(@click.capture="collapsed = false") Int. Bounds
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
              v-tooltip(bottom)
                template(v-slot:activator="{ on }")
                  v-btn(v-on="on", flat, small, icon)
                    v-icon(v-if="collapsed", @click="collapsed = false") mdi-plus-box
                    v-icon(v-if="!collapsed", @click="collapsed = true") mdi-minus-box
                span Show / hide configuration menu
          v-layout(v-if="!collapsed", align-start)
            v-flex(sm12)
              v-tabs-items(v-model="tab", :mandatory="!collapsed")
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
                        v-text-field(
                          v-model="settings.crystal.theta"
                          , type="number"
                          , label="Theta"
                          , suffix="degrees"
                          , :readonly="settings.crystal.autoCalcTheta"
                          , :required="!settings.crystal.autoCalcTheta"
                          , :messages="settings.crystal.autoCalcTheta ? '(auto calculating)' : ''"
                        )
                          template(v-slot:prepend)
                            v-icon(
                              @click="settings.crystal.autoCalcTheta = !settings.crystal.autoCalcTheta"
                              , :color="settings.crystal.autoCalcTheta ? 'blue' : ''"
                            ) mdi-auto-fix
                      v-flex(sm3)
                        v-text-field(v-model="settings.crystal.phi", type="number", label="Phi", suffix="degrees")
                      v-flex(sm3)
                        v-text-field(v-model="settings.crystal.length", type="number", label="Length", suffix="um")
                      v-flex(sm3)
                        v-text-field(v-model="settings.crystal.temperature", type="number", label="Temperature", suffix="K")

                v-tab-item(:transition="false", :reverse-transition="false", grow)
                  v-container.properties(fluid, grid-list-lg, px-0, py-3)
                    v-layout(align-start)
                      v-flex(sm3)
                        v-switch.pt-3(v-model="settings.crystal.periodicPoling.enabled", label="Enable Periodic Poling")
                      v-flex(v-if="settings.crystal.periodicPoling.enabled", sm3)
                        v-text-field(
                          v-model="settings.crystal.periodicPoling.period"
                          , type="number"
                          , label="Period"
                          , suffix="um"
                          , :readonly="settings.crystal.periodicPoling.autoCalcPeriod"
                          , :required="!settings.crystal.periodicPoling.autoCalcPeriod"
                          , :messages="settings.crystal.periodicPoling.autoCalcPeriod ? '(auto calculating)' : ''"
                        )
                          template(v-slot:prepend)
                            v-icon(
                              @click="settings.crystal.periodicPoling.autoCalcPeriod = !settings.crystal.periodicPoling.autoCalcPeriod"
                              , :color="settings.crystal.periodicPoling.autoCalcPeriod ? 'blue' : ''"
                            ) mdi-auto-fix
                    v-layout(v-if="settings.crystal.periodicPoling.enabled", align-start)
                      v-flex(sm3)
                        v-switch.pt-3(
                          v-model="settings.crystal.periodicPoling.apodizationEnabled"
                          , label="Enable Apodization"
                        )
                      v-flex(sm3)
                        v-text-field(
                          v-model="settings.crystal.periodicPoling.apodizationFWHM"
                          , type="number"
                          , label="Apodization FWHM"
                          , suffix="um"
                          , :disabled="!settings.crystal.periodicPoling.apodizationEnabled"
                          , :required="!settings.crystal.periodicPoling.apodizationEnabled"
                        )
                      v-flex(sm3)
                        v-text-field(
                          v-model="settings.crystal.periodicPoling.apodizationFWHM"
                          , type="number"
                          , label="Apodization Steps"
                          , :disabled="!settings.crystal.periodicPoling.apodizationEnabled"
                          , :required="!settings.crystal.periodicPoling.apodizationEnabled"
                        )

                v-tab-item(:transition="false", :reverse-transition="false", grow)
                  v-container.properties(fluid, grid-list-lg, px-0, py-3, fill-height)
                    v-layout
                      v-flex(sm4)
                        v-text-field(v-model="settings.pump.wavelength", type="number", label="Wavelength", suffix="nm")
                      v-flex(sm4)
                        v-text-field(v-model="settings.pump.bandwidth", type="number", label="Bandwidth FWHM", suffix="nm")
                      v-flex(sm4)
                        v-text-field(v-model="settings.pump.waist", type="number", label="Waist 1/e^2", suffix="um")

                v-tab-item(:transition="false", :reverse-transition="false")
                  v-container.properties(fluid, grid-list-lg, px-0, py-3)
                    v-layout(align-start)
                      v-flex(sm3)
                        v-text-field(v-model="settings.signal.wavelength", type="number", label="Wavelength", suffix="nm")
                        v-text-field(v-model="settings.signal.waist", type="number", label="Waist 1/e^2", suffix="um")
                      v-flex(sm3)
                        v-text-field(v-model="settings.signal.theta", type="number", label="Theta", suffix="degrees")
                        v-text-field(v-model="settings.signal.phi", type="number", label="Phi", suffix="degrees")
                      v-flex(sm3)
                        v-switch.pa-2(v-model="settings.signal.fiberCoupling", label="Fiber Coupling")
                      v-flex(sm3)
                        v-text-field(
                          v-model="settings.signal.waistPosition"
                          , type="number"
                          , label="Waist Position"
                          , suffix="um"
                          , :readonly="settings.signal.autoCalcWaistPosition"
                          , :required="!settings.signal.autoCalcWaistPosition"
                          , :messages="settings.signal.autoCalcWaistPosition ? '(auto calculating)' : ''"
                        )
                          template(v-slot:prepend)
                            v-icon(
                              @click="settings.signal.autoCalcWaistPosition = !settings.signal.autoCalcWaistPosition"
                              , :color="settings.signal.autoCalcWaistPosition ? 'blue' : ''"
                            ) mdi-auto-fix

                v-tab-item(:transition="false", :reverse-transition="false")
                  v-sheet.pt-2.px-2(tile, color="grey darken-3")
                    v-container(fluid, grid-list-lg, px-0, py-0)
                      v-layout(align-start)
                        v-flex(sm3)
                          v-select(v-model="settings.filters.signal.type", :items="['Gaussian', 'Square']", label="Signal Filter")
                        v-flex(sm3)
                          v-text-field(v-model="settings.filters.signal.cw", type="number", label="Center Wavelength", suffix="nm")
                        v-flex(sm3)
                          v-text-field(v-model="settings.filters.signal.bw", type="number", label="Bandwidth", suffix="nm")
                        v-flex(sm3)
                  v-sheet.pt-2.px-2(tile, color="brown darken-3")
                    v-container(fluid, grid-list-lg, px-0, py-0)
                      v-layout(align-start)
                        v-flex(sm3)
                          v-select(v-model="settings.filters.idler.type", :items="['Gaussian', 'Square']", label="Idler Filter")
                        v-flex(sm3)
                          v-text-field(v-model="settings.filters.idler.cw", type="number", label="Center Wavelength", suffix="nm")
                        v-flex(sm3)
                          v-text-field(v-model="settings.filters.idler.bw", type="number", label="Bandwidth", suffix="nm")
                        v-flex(sm3)


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

    , session: {
      presets: {
        list: ['Awesome experiment 1', 'test']
        , selected: null
        , name: null
      }
    }

    , editingPreset: null
    , editingPresetIndex: null

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
        , autoCalcTheta: false
        , phi: 0
        , length: 2000
        , temperature: 20

        , periodicPoling: {
          enabled: false
          , autoCalcPeriod: false
        }
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

        , autoCalcWaistPosition: true
        , waistPosition: -563.63
      }
      , filters: {
        signal: {
          type: 'Gaussian'
        }
        , idler: {
          type: 'Gaussian'
        }
      }
    }
  })
  , computed: {
    extensionHeight(){
      return this.collapsed ? 36 : 196
    }
  }
  , watch: {
    collapsed( val ){
      if ( val ){
        this.oldTab = this.tab
        this.tab = -1
      } else if ( this.tab === -1 ){
        this.tab = this.oldTab
      }
    }
  }
  , methods: {
    newPreset(){

    }
    , editPreset (index, item) {
      if (!this.editingPreset) {
        this.editingPreset = item
        this.editingPresetIndex = index
      } else {
        this.editingPreset = null
        this.editingPresetIndex = -1
      }
    }
  }
}
</script>

<style lang="sass" scoped>
.logo
  vertical-align: middle
.extension
  width: 100%
  height: 100%

.container.properties
  .layout
    margin-top: -16px

    &:first-child
      margin-top: -8px
  .crystal-info
    padding: 6px
</style>
