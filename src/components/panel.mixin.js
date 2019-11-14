import { mapGetters, mapActions } from 'vuex'
import _cloneDeep from 'lodash/cloneDeep'

export default {
  props: {
    id: {
      type: String
      , required: true
    }
  }
  , data: () => ({
    panelSettings: {}
  })
  , computed: {
    ...mapGetters('panels', [
      'panel'
    ])
    , panelSettingsRaw(){
      return this.panel(this.id).settings
    }
  }
  , created(){
    const id = this.id
    let unwatch

    this.$watch('panelSettingsRaw', settings => {
      if ( unwatch ){ unwatch() }

      this.panelSettings = Object.assign({}, this.panelSettings, _cloneDeep(settings))

      unwatch = this.$watch('panelSettings', settings => {
        this.setPanelSettings({ id, settings })
      }, { deep: true })
    }, { immediate: true })

    this.setPanelSettings({ id, settings: this.panelSettings })
  }
  , mounted(){
    const unwatch = this.$store.watch(
      (state, getters) =>
        this.panelSettings.autoUpdate &&
        getters['parameters/isReady'] &&
        !getters['parameters/isEditing'] &&
        ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , ( refresh ) => refresh && this.$emit('parametersUpdated')
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
    })
  }
  , methods: {
    ...mapActions('panels', [
      'setPanelSettings'
    ])
  }
}
