<template lang="pug">
.drawer
  v-navigation-drawer(
    app
    , clipped
    , dark
    , color="navbar"
    , width="280"
    , :value="drawerOpen"
    , stateless
  ).nav
    v-layout(fill-height)
      //- desktop view
      transition(name="fade-drawer", mode="out-in")
        v-container.settings(v-if="showSettings")
          v-expansion-panels(v-model="panel", multiple, accordion)
            v-expansion-panel(v-for="drawer in panelDrawers", :key="drawer.label")
              v-expansion-panel-header {{drawer.label}}
              v-expansion-panel-content
                v-component.settings-group(:is="drawer.type")
</template>

<script>
import CrystalSettings from '@/components/settings-tabs/crystal-settings.vue'
import PeriodicPolingSettings from '@/components/settings-tabs/periodic-poling-settings.vue'
import PumpSettings from '@/components/settings-tabs/pump-settings.vue'
import SignalSettings from '@/components/settings-tabs/signal-settings.vue'
import FilterSettings from '@/components/settings-tabs/filter-settings.vue'
import IntegrationSettings from '@/components/settings-tabs/integration-settings.vue'

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

<style lang="sass" scoped>
.nav
  height: auto !important
  min-height: 100% !important
.settings
  padding: 0
  overflow-y: auto
  margin-bottom: 100px
  .settings-group
    padding-top: 0
  ::v-deep(.v-expansion-panel:before)
    box-shadow: none
  ::v-deep(.v-expansion-panels .v-expansion-panel)
    background: $color-navbar-dark
  ::v-deep(.v-expansion-panel-header)
    font-size: 14px
    padding: 12px
  ::v-deep(.v-expansion-panel--active .v-expansion-panel-header)
    min-height: 48px
  ::v-deep(.v-expansion-panel-content__wrap)
    padding: 0

.fade-drawer-enter-active, .fade-drawer-leave-active
  transition: opacity .3s
.fade-drawer-enter-active
  transition-delay: .15s
.fade-drawer-enter, .fade-drawer-leave-to
  opacity: 0
</style>
