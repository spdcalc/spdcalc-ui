<template lang="pug">
v-app#app
  SettingsDrawer(:is-open="settingsOpen")
  v-app-bar(app, dark, color="navbar", dense, clipped-left, clipped-right)
    v-app-bar-nav-icon(@click="settingsOpen = !settingsOpen")
    img.logo(src="@/assets/spdcalc-logo.png", alt="SPDCalc", height="32")

    v-spacer
    PresetControl
    v-btn(icon)
      v-icon more_vert

  v-main
    router-view

  //- SiteFooter
  ContextDrawer
  AppMessages
</template>

<script>
import SiteFooter from '@/components/site-footer.vue'
import AppMessages from '@/components/app-messages.vue'
import SettingsDrawer from '@/components/settings-drawer.vue'
import ContextDrawer from '@/components/context-drawer.vue'
import PresetControl from '@/components/preset-control.vue'

export default {
  name: 'App'
  , components: {
    SiteFooter
    , AppMessages
    , SettingsDrawer
    , ContextDrawer
    , PresetControl
  }
  , data: () => ({
    settingsOpen: true
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
