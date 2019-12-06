<template lang="pug">
v-toolbar-items
  v-combobox(
    label="(select/create preset)"
    , v-model="selectedPreset"
    , :items="allPresets"
    , :search-input.sync="presetName"
    , :hide-no-data="!presetName"
    , @blur="onBlur"
    , :hide-details="true"
    , solo
    , flat
    , background-color="navbar"
    , item-text="name"
  )
    template(v-slot:no-data)
      span
    template(v-slot:append-item)
      v-list-item(v-if="isNewName", @click="newPreset()", ripple)
        v-list-item-action
          v-icon add
        v-list-item-content
          v-list-item-title
            | Create
            | &nbsp;
            span {{ presetName }}
    template(v-slot:item="{ index, item }")
      v-list-item-content
        v-text-field(v-if="editingPresetId === item.id", v-model="editingPresetName", autofocus, flat, background-color="transparent", hide-details, solo, @keyup.enter="editPreset(index, item)")
        span(v-else) {{ item.name }}
      v-spacer
      v-list-item-action(@click.stop)
        v-btn(v-if="editingPresetId === item.id", icon, @click.stop.prevent="deletePreset(item)", color="error")
          v-icon mdi-delete-circle
      v-list-item-action(@click.stop)
        v-btn(icon, @click.stop.prevent="editPreset(item)", :color="editingPresetId === item.id ? 'primary': ''")
          v-icon {{ editingPresetId === item.id ? 'mdi-check-circle' : 'edit' }}

  v-btn(:color="isDirty ? 'warning' : 'success'", icon, :disabled="!isDirty", @click="save")
    v-icon {{ isDirty ? 'mdi-content-save-alert' : 'mdi-content-save' }}
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import _cloneDeep from 'lodash/cloneDeep'
import _findIndex from 'lodash/findIndex'
import _debounce from 'lodash/debounce'

export default {
  name: 'PresetControl'
  , components: {
  }
  , data: () => ({
    presetName: ''

    , editingPresetName: null
    , editingPresetId: null
  })
  , computed: {
    ...mapGetters('presets', {
      selected: 'selected'
      , allPresets: 'all'
    })
    , ...mapGetters('parameters', {
      parameterHash: 'hashString'
    })
    , isNewName(){
      return this.presetName && _findIndex(this.allPresets, { name: this.presetName }) < 0
    }
    , isDirty(){
      // is the state of the preset different from the settings?
      if (!this.selected) { return false }
      return this.selected.data.parameters !== this.parameterHash
    }
    , selectedPreset: {
      get(){
        return this.selected
      }
      , set(v){
        this.loadPreset({ id: v && v.id })
      }
    }
  }
  , watch: {
  }
  , methods: {
    ...mapActions('presets', {
      loadPreset: 'load'
      , createPreset: 'create'
      , updatePreset: 'update'
      , removePreset: 'remove'
    })
    , newPreset(){
      this.createPreset({ name: this.presetName })
    }
    , editPreset(item) {
      if (!this.editingPresetId) {
        this.editingPresetName = item.name
        this.editingPresetId = item.id
      } else if (this.editingPresetName) {
        if (this.selectedPreset && this.selectedPreset.id === this.editingPresetId){
          this.presetName = this.editingPresetName
        }
        this.updatePreset({ id: this.editingPresetId, name: this.editingPresetName })
        this.editingPresetName = null
        this.editingPresetId = null
      }
    }
    , deletePreset(item){
      this.removePreset(item)
      this.editingPresetName = null
      this.editingPresetId = null
    }
    , save(){
      if (!this.selected){ return }
      this.updatePreset({ id: this.selected.id, withData: true })
    }
    , onBlur: _debounce(function(){
      this.presetName = this.selectedPreset && this.selectedPreset.name
    }, 200)
  }
}
</script>

<style lang="sass" scoped>
</style>
