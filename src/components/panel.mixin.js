import { mapGetters, mapActions } from 'vuex'
import _cloneDeep from 'lodash/cloneDeep'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import _isEqual from 'lodash/isEqual'

import SPDPanel from '@/components/spd-panel.vue'
import SPDCol from '@/components/spd-col.vue'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import ParameterSelector from '@/components/inputs/parameter-selector.vue'
import IconButton from '@/components/icon-button.vue'

import { BatchWorker } from '@/lib/batch-worker'
import createWorker from '@/workers/spdcalc'

const lerp = (a, b, t) => a * (1 - t) + b * t

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
    , SPDCol
    , ParameterInput
    , ParameterSelector
    , IconButton
  }
  , computed: {
    ...mapGetters('panels', [
      'panel'
    ])
    , ...mapGetters('parameters', {
      parametersReady: 'isReady'
    })
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
  , watch: {
    parametersReady(val){
      if (!val){ return }
      this.$emit('parametersUpdated')
    }
  }
  , created(){
    this.calculate = _debounce(this.calculate.bind(this), 100)

    const spdWorkers = BatchWorker(createWorker)
    this.spdWorkers = spdWorkers

    const id = this.id
    let unwatch

    this.$watch('panelSettingsRaw', settings => {
      if ( _isEqual(this.panelSettings, settings) ){ return }
      if ( unwatch ){ unwatch() }

      this.panelSettings = Object.assign(_cloneDeep(this.panelSettings), _cloneDeep(settings))

      unwatch = this.$watch('panelSettings', settings => {
        this.setPanelSettings({ id, settings })
      }, { deep: true })
    }, { immediate: true })

    this.setPanelSettings({ id, settings: this.panelSettings })
  }
  , mounted(){
    const unwatch = this.$watch(
      (state, getters) => {
        return this.panelSettings.autoUpdate &&
        this.$store.getters['parameters/isReady'] &&
        ({ spdConfig: this.$store.getters['parameters/spdConfig'], integrationConfig: this.$store.getters['parameters/integrationConfig'] })
      }
      , ( v, ov ) => {
        if ( _isEqual(v, ov) ){ return }
        v && this.$emit('parametersUpdated')
      }
      , { deep: true, immediate: true }
    )

    this.$on('hook:beforeDestroy', () => {
      this.spdWorkers?.destroy()
      unwatch()
    })
  }
  , methods: {
    ...mapActions('panels', [
      'setPanelSettings'
    ])
    , checkRecalculate(v, ov){
      if ( !this.panelSettings.autoUpdate ){ return }
      if ( _isEqual(v, ov) ){ return }
      this.calculate()
    }
    , getStepArray(min, max, steps){
      const stepper = t => lerp(min, max, t)
      return _times(steps, n => stepper(n / (steps - 1)))
    }
  }
}
