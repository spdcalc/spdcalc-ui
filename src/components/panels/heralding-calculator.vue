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
      v-btn.calc(small, color="primary", @click="calculate", :loading="loading") Calculate
  v-container
    h3.text-center Results
    v-row
      v-col.singles(sm="12")
        h4 Singles
        p Signal Count Rate: {{ results.signal_singles_rate }}
        p Idler Count Rate: {{ results.idler_singles_rate }}
      v-col.coincidences(sm="12")
        h4 Coincidences
        p Rate: {{ results.coincidences_rate }}
    v-row
      v-col.efficiency(sm="12")
        h4 Efficiencies
        p Signal Efficiency: {{ results.signal_efficiency }}
        p Idler Efficiency: {{ results.idler_efficiency }}
</template>

<script>
import { mapGetters } from 'vuex'
import SPDPanel from '@/components/spd-panel.vue'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import _debounce from 'lodash/debounce'

import createWorker from '@/workers/spdcalc'
// new thread
const { worker: spdcalc } = createWorker()

export default {
  name: 'heralding-calculator'
  , props: {
  }
  , data: () => ({
    loading: false
    , params: {
      signal_waist: 100
      , idler_waist: 100
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
    , calculate: _debounce(function(){
      this.loading = true
      this.$store.dispatch('jobs/start', { job: 'heralding calculation' })
      spdcalc.getHeraldingResults(
        this.spdConfig
        , this.integrationConfig
        , this.params.signal_waist
        , this.params.idler_waist
      ).then(results => {
        this.results = results
        this.$store.dispatch('jobs/complete', { job: 'heralding calculation' })
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating heralding results' })
      }).finally(() => {
        setTimeout(() => {
          this.loading = false
        }, 100)
      })
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
