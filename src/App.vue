<template lang="pug">
v-app
  v-navigation-drawer(v-model="drawer", app, clipped, mobile-break-point="719")
    v-list(dense)
      v-list-item(:to="{ name: 'jsa' }")
        v-list-item-action
          v-icon mdi-chart-scatterplot-hexbin
        v-list-item-content
          v-list-item-title JSA Calibration
      v-divider
      v-list-item(:to="{ name: 'about' }")
        v-list-item-action
          v-icon info
        v-list-item-content
          v-list-item-title About
      v-list-item(:to="{ name: 'benchmarks' }")
        v-list-item-action
          v-icon mdi-speedometer
        v-list-item-content
          v-list-item-title Benchmarks
  v-app-bar(app, dark, dense, clipped-left, :extension-height="extensionHeight")
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
        , item-text="name"
        , @keypress.enter="newPreset()"
      )
        template(v-slot:no-data)
          v-list-item(@click="newPreset()", ripple)
            v-list-item-action
              v-icon add
            v-list-item-content
              v-list-item-title
                | Create
                | &nbsp;
                span {{ session.presets.name }}
        template(v-slot:item="{ index, item }")
          v-list-item-content
            v-text-field(v-if="editingPreset === item", v-model="editingPreset.name", autofocus, flat, background-color="transparent", hide-details, solo, @keyup.enter="editPreset(index, item)")
            span(v-else) {{ item.name }}
          v-spacer
          v-list-item-action(@click.stop)
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
      //-     v-list-item(
      //-       @click="newPreset()"
      //-       , ripple
      //-     )
      //-       v-list-item-action
      //-         v-icon add
      //-       v-list-item-content
      //-         v-list-item-title
      //-           span New Preset
      //-     v-divider.mt-2
    v-btn(color="success", text) save
    v-btn(icon)
      v-icon more_vert

    template(v-slot:extension)
      .extension
        v-container(fluid, pa-0)
          v-layout(align-start)
            v-tabs(v-model="tab", :height="36", :hide-slider="collapsed", :mandatory="!collapsed")
              v-tab(@click.capture="collapsed = false") Crystal
              v-tab(@click.capture="collapsed = false") Periodic Poling
              v-tab(@click.capture="collapsed = false") Pump
              v-tab(@click.capture="collapsed = false") Signal
              v-tab(@click.capture="collapsed = false") Filters
              v-tab(@click.capture="collapsed = false") Int. Bounds
              v-spacer
              v-bottom-sheet(v-model="helpOpen", hide-overlay, persistent)
                template(v-slot:activator="{ on }")
                  v-btn(v-on="on", text)
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
                  v-btn.pa-0(v-on="on", text)
                    v-icon(v-if="collapsed", @click="collapsed = false") mdi-plus
                    v-icon(v-if="!collapsed", @click="collapsed = true") mdi-minus
                span Show / hide configuration menu
          v-layout(v-if="!collapsed", align-start)
            v-flex(sm12)
              v-tabs-items(v-model="tab", dark, :mandatory="!collapsed")
                v-tab-item(transition="fade", reverse-transition="fade")
                  CrystalSettings
                v-tab-item(transition="fade", reverse-transition="fade")
                  PeriodicPolingSettings
                v-tab-item(transition="fade", reverse-transition="fade")
                  PumpSettings
                v-tab-item(transition="fade", reverse-transition="fade")
                  SignalSettings
                v-tab-item(transition="fade", reverse-transition="fade")
                  FilterSettings
                v-tab-item(transition="fade", reverse-transition="fade")
                  IntegrationSettings
  v-content
    v-app-bar-nav-icon(@click.stop="drawer = !drawer")

    v-container(fluid)
      router-view
  SiteFooter
</template>

<script>
import SiteFooter from '@/components/site-footer'
import CrystalSettings from '@/components/settings-tabs/crystal-settings'
import PeriodicPolingSettings from '@/components/settings-tabs/periodic-poling-settings'
import PumpSettings from '@/components/settings-tabs/pump-settings'
import SignalSettings from '@/components/settings-tabs/signal-settings'
import FilterSettings from '@/components/settings-tabs/filter-settings'
import IntegrationSettings from '@/components/settings-tabs/integration-settings'

export default {
  name: 'App'
  , components: {
    SiteFooter
    , CrystalSettings
    , PeriodicPolingSettings
    , PumpSettings
    , SignalSettings
    , FilterSettings
    , IntegrationSettings
  }
  , data: () => ({
    drawer: null
    , helpOpen: false
    , tab: null
    , collapsed: false

    , session: {
      presets: {
        list: [
          { name: 'Awesome experiment 1' }
          , { name: 'test' }
        ]
        , selected: null
        , name: null
      }
    }

    , editingPreset: null
    , editingPresetIndex: null

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
      , integrationBounds: {
        autoCalc: false
        , gridSize: 100
        , signal: [ 1400, 1600 ]
        , idler: [ 1400, 1600 ]
      }
    }
  })
  , computed: {
    extensionHeight(){
      return this.collapsed ? 36 : 200
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
    margin-top: -10px

    &:first-child
      margin-top: -6px
  .crystal-info
    padding: 6px
</style>
