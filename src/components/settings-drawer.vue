<template lang="pug">
v-navigation-drawer(
  app
  , clipped
  , mobile-break-point="719"
  , color="blue-grey darken-3"
  , dark
  , :mini-variant="!drawerOpen"
  , mini-variant-width="56"
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
            v-icon mdi-diamond-outline
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
      v-container.pa-0.settings(v-if="showSettings")
        CrystalSettings.pb-0
        PeriodicPolingSettings.py-0
</template>

<script>
import CrystalSettings from '@/components/settings-tabs/crystal-settings'
import PeriodicPolingSettings from '@/components/settings-tabs/periodic-poling-settings'
import PumpSettings from '@/components/settings-tabs/pump-settings'
import SignalSettings from '@/components/settings-tabs/signal-settings'
import FilterSettings from '@/components/settings-tabs/filter-settings'
import IntegrationSettings from '@/components/settings-tabs/integration-settings'

export default {
  name: 'SettingsDrawer'
  , props: {
  }
  , data: () => ({
    showSettings: true
    , drawerOpen: true
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

<style lang="sass" scoped>
.mini-nav
  min-width: 56px
  max-width: 56px

.fade-drawer-enter-active, .fade-drawer-leave-active
  transition: opacity .3s
.fade-drawer-enter-active
  transition-delay: .15s
.fade-drawer-enter, .fade-drawer-leave-to
  opacity: 0
</style>
