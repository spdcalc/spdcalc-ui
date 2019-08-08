<template lang="pug">
v-navigation-drawer(
  app
  , clipped
  , mobile-break-point="719"
  , color="blue-grey darken-3"
  , dark
  , :mini-variant="!drawerOpen"
  , mini-variant-width="56"
  , width="300"
)
  v-layout(fill-height)
    v-navigation-drawer.mini-nav(
      dark
      , mini-variant
      , mini-variant-width="72"
      , permanent
    )
      v-list(shaped)
        v-list-item(@click="toggle", :input-value="showSettings")
          v-list-item-action
            v-icon mdi-tune
        v-list-item(@click="")
          v-list-item-action
            v-icon mdi-call-split
        v-list-item(@click="")
          v-list-item-action
            v-icon mdi-image-filter-none
        v-list-item(@click="")
          v-list-item-action
            v-icon mdi-chart-bell-curve
        v-list-item(@click="")
          v-list-item-action
            v-icon mdi-help
      v-divider

    transition(name="fade-drawer", mode="out-in")
      v-container.settings.pa-0(v-if="showSettings")
        v-expansion-panels(v-model="panel", color="blue-grey darken-2", multiple, accordion)
          v-expansion-panel(v-for="drawer in panelDrawers", :key="drawer.label")
            v-expansion-panel-header {{drawer.label}}
            v-expansion-panel-content
              v-component.pt-0(:is="drawer.type")
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
  }
  , data: () => ({
    showSettings: true
    , drawerOpen: true
    , panel: Object.keys(panelDrawers).map(v => v | 0)
    , panelDrawers
  })
  , components: {
    CrystalSettings
    , PeriodicPolingSettings
    , PumpSettings
    , SignalSettings
    , FilterSettings
    , IntegrationSettings
  }
  , computed: {
  }
  , methods: {
    toggle(){
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
.mini-nav
  min-width: 56px
  max-width: 56px

.settings
  overflow-y: auto
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
