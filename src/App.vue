<template lang="pug">
v-app#app
  SettingsDrawer(:is-open="settingsOpen")
  v-app-bar(app, dark, color="navbar", dense, clipped-left, clipped-right, :extension-height="extensionHeight")
    v-app-bar-nav-icon(@click="settingsOpen = !settingsOpen")
    img.logo(src="@/assets/spdcalc-logo.png", alt="SPDCalc", height="32")

    v-spacer
    v-toolbar-items
      v-combobox(
        label="(no preset)"
        , v-model="session.presets.selected"
        , :items="session.presets.list"
        , :search-input.sync="session.presets.name"
        , :hide-no-data="!session.presets.name"
        , :hide-details="true"
        , solo
        , flat
        , background-color="navbar"
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

    v-btn(color="success", text) save
    v-btn(icon)
      v-icon more_vert

  v-content
    router-view

  //- SiteFooter
  ContextDrawer
  AppMessages
</template>

<script>
import SiteFooter from '@/components/site-footer'
import AppMessages from '@/components/app-messages'
import SettingsDrawer from '@/components/settings-drawer'
import ContextDrawer from '@/components/context-drawer'

export default {
  name: 'App'
  , components: {
    SiteFooter
    , AppMessages
    , SettingsDrawer
    , ContextDrawer
  }
  , data: () => ({
    settingsOpen: true
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
