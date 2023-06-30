<template lang="pug">
v-app#app
  SettingsDrawer(:is-open="settingsOpen")
  v-app-bar(app, dark, color="navbar", dense, clipped-left, clipped-right)
    v-app-bar-nav-icon(@click="settingsOpen = !settingsOpen")
    img.logo(src="@/assets/spdcalc-logo.png", alt="SPDCalc", height="32")

    v-spacer
    PresetControl
    v-menu offset-y
      template(v-slot:activator="{ on }")
        v-btn(v-on="on", icon)
          v-icon more_vert
      v-list
        v-list-item(@click="importSettingsDialog = true")
          v-list-item-title Import Settings
        v-list-item(@click="exportSettingsDialog = true")
          v-list-item-title Export Settings
        v-list-item()
          v-list-item-title About
  v-main
    router-view

  //- SiteFooter
  ContextDrawer
  AppMessages
  //- models
  ExportSettings(v-model="exportSettingsDialog")
  ImportSettings(v-model="importSettingsDialog")
</template>

<script>
import SiteFooter from '@/components/site-footer.vue'
import AppMessages from '@/components/app-messages.vue'
import SettingsDrawer from '@/components/settings-drawer.vue'
import ContextDrawer from '@/components/context-drawer.vue'
import PresetControl from '@/components/preset-control.vue'
import ExportSettings from './components/dialogs/export-settings.vue'
import ImportSettings from './components/dialogs/import-settings.vue'

export default {
  name: 'App'
  , components: {
    SiteFooter
    , AppMessages
    , SettingsDrawer
    , ContextDrawer
    , PresetControl
    , ExportSettings
    , ImportSettings
  }
  , data: () => ({
    settingsOpen: true,
    exportSettingsDialog: false,
    importSettingsDialog: false
  })
}
</script>

<style lang="sass">
body
  min-width: 660px
#app
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

.theme--dark.v-input:not(.v-input--is-disabled)
  .v-text-field__suffix,
  .v-text-field__prefix
    color: #ffffff
</style>
