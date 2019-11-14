import { mapGetters, mapActions } from 'vuex'
import _cloneDeep from 'lodash/cloneDeep'

import SPDPanel from '@/components/spd-panel'
import ParameterInput from '@/components/inputs/parameter-input'
import IconButton from '@/components/icon-button'

import { BatchWorker } from '@/lib/batch-worker'
import CreateWorker from '@/workers/spdcalc'

const spdWorkers = BatchWorker(() => new CreateWorker())

export default {
  props: {
    id: {
      type: String
      , required: true
    }
  }
  , data: () => ({
    panelSettings: {
      autoUpdate: true
    }
    , status: ''
    , loading: false
  })
  , components: {
    SPDPanel
    , ParameterInput
    , IconButton
  }
  , computed: {
    ...mapGetters('panels', [
      'panel'
    ])
    , panelSettingsRaw(){
      return this.panel(this.id).settings
    }
    , statusMsg(){
      if ( this.loading ){
        return 'calculating...'
      }

      return this.status
    }
  }
  , created(){
    this.spdWorkers = spdWorkers

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
      , { deep: true }
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
