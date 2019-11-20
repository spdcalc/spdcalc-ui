<template lang="pug">
.drawer
  v-navigation-drawer(
    app
    , clipped
    , color="blue-grey darken-3"
    , dark
    , width="280"
    , :value="drawerOpen"
    , stateless
  )
    v-layout(fill-height)
      //- desktop view
      transition(name="fade-drawer", mode="out-in")
        v-container.settings(v-if="showSettings")
          v-expansion-panels(v-model="panel", color="blue-grey darken-2", multiple, accordion)
            v-expansion-panel(v-for="drawer in panelDrawers", :key="drawer.label")
              v-expansion-panel-header {{drawer.label}}
              v-expansion-panel-content
                v-component.settings-group(:is="drawer.type")
</template>

<script>
import CrystalSettings from '@/components/settings-tabs/crystal-settings'
import PeriodicPolingSettings from '@/components/settings-tabs/periodic-poling-settings'
import PumpSettings from '@/components/settings-tabs/pump-settings'
import SignalSettings from '@/components/settings-tabs/signal-settings'
import FilterSettings from '@/components/settings-tabs/filter-settings'
import IntegrationSettings from '@/components/settings-tabs/integration-settings'

const panelDrawers = [
  {
    label: 'Crystal'
    , type: 'CrystalSettings'
  }
  , {
    label: 'Periodic Poling'
    , type: 'PeriodicPolingSettings'
  }
  , {
    label: 'Pump'
    , type: 'PumpSettings'
  }
  , {
    label: 'Signal'
    , type: 'SignalSettings'
  }
  // , {
  //   label: 'Filters'
  //   , type: 'FilterSettings'
  // }
  , {
    label: 'Integration'
    , type: 'IntegrationSettings'
  }
]

export default {
  name: 'SettingsDrawer'
  , props: {
    isOpen: {
      type: Boolean
      , default: true
    }
  }
  , data: () => ({
    showSettings: true
    , panel: Object.keys(panelDrawers).map(v => v | 0)
    , panelDrawers
    , drawerOpen: true
    // , isOpen: true
  })
  , components: {
    CrystalSettings
    , PeriodicPolingSettings
    , PumpSettings
    , SignalSettings
    , FilterSettings
    , IntegrationSettings
  }
  , mounted(){
  }
  , computed: {
  }
  , watch: {
    isOpen(){
      if ( this.showSettings ){
        this.showSettings = false
        setTimeout(() => {
          this.drawerOpen = false
        }, 150)
      } else {
        this.showSettings = true
        this.drawerOpen = true
      }
    }
  }
}
</script>

<style lang="sass">
.settings
  padding: 0
  overflow-y: auto
  .settings-group
    padding-top: 0
  .v-expansion-panel:before
    box-shadow: none
  .v-expansion-panels .v-expansion-panel
    background: #37474f
  .v-expansion-panel-header
    font-size: 14px
    padding: 12px
  .v-expansion-panel--active .v-expansion-panel-header
    min-height: 48px
  .v-expansion-panel-content__wrap
    padding: 0

.fade-drawer-enter-active, .fade-drawer-leave-active
  transition: opacity .3s
.fade-drawer-enter-active
  transition-delay: .15s
.fade-drawer-enter, .fade-drawer-leave-to
  opacity: 0
</style>
