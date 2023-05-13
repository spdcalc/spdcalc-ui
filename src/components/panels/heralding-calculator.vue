<template lang="pug">
SPDPanel(
  title="Heralding Calculator"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="1"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="Signal Waist"
        , v-model="params.signal_waist"
        , :sigfigs="2"
        , units="µm"
        , lazy
      )
      ParameterInput(
        label="Idler Waist"
        , v-model="params.idler_waist"
        , :sigfigs="2"
        , units="µm"
        , lazy
      )
      ParameterInput(
        label="Pump Waist"
        , v-model="params.pump_waist"
        , :sigfigs="2"
        , units="µm"
        , lazy
      )
      v-btn.calc(small, color="primary", @click="calculate", :loading="loading") Calculate
  v-container
    h3.text-center Results
    v-row
      v-col.singles(sm="12")
        h4 Singles
        p Signal Count Rate: {{ results.signal_singles }}
        p Idler Count Rate: {{ results.idler_singles }}
      v-col.coincidences(sm="12")
        h4 Coincidences
        p Rate: {{ results.coincidences }}
    v-row
      v-col.efficiency(sm="12")
        h4 Efficiencies
        p Signal Efficiency: {{ results.signal }}
        p Idler Efficiency: {{ results.idler }}
</template>

<script>
import { mapGetters } from 'vuex'
import panelMixin from '@/components/panel.mixin'
import SPDPanel from '@/components/spd-panel.vue'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import { interruptDebounce } from '../../lib/batch-worker'
// new thread

export default {
  name: 'heralding-calculator'
  , props: {
  }
  , mixins: [panelMixin]
  , data: () => ({
    loading: false
    , params: {
      signal_waist: 100
      , idler_waist: 100
      , pump_waist: 100
    }
    , results: {}
  })
  , components: {
    SPDPanel
    , ParameterInput
  }
  , computed: {
    ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
    , ...mapGetters('plots/jsi', [
      'data'
    ])
  }
  , created(){
    const unwatch = this.$store.watch(
      (state, getters) => getters['parameters/isReady'] &&
        !getters['parameters/isEditing'] &&
        ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , ( refresh ) => refresh && this.calculate()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
    })
  }
  , mounted(){
    this.calculate()
  }
  , methods: {
    clear(){
      this.results = {}
    }
    , calculate(){
      this.results = {}
      return this.getResults().then(({ result, duration }) => {
        this.results = result
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating heralding results' })
      })
    }
    , getResults: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getHeraldingResults',
        this.spdConfig
        , { ...this.integrationConfig, size: 20 }
        , this.params.signal_waist
        , this.params.idler_waist
        , this.params.pump_waist
      )
    }, 300)
  }
}
</script>

<style lang="sass" scoped>
.props-toolbar.right
  display: flex
  justify-content: flex-end
.props-toolbar .calc
  flex: none
</style>
