<template lang="pug">
v-card.heralding-calc
  v-toolbar(flat, dark, color="blue-grey darken-2")
    v-toolbar-title Heralding Calculator
    v-spacer
    v-btn(
      icon
      , color="red lighten-1"
      , @click="$emit('remove')"
    )
      v-icon mdi-close
  v-responsive(:aspect-ratio="1")
    v-container
      v-row
        v-col
          v-text-field(
            v-model="params.signal_waist"
            , type="number"
            , label="Signal Waist"
            , suffix="µm"
            , novalidate
          )
        v-col
          v-text-field(
            v-model="params.idler_waist"
            , type="number"
            , label="Idler Waist"
            , suffix="µm"
            , novalidate
          )
      v-row
        v-col.text-right
          v-btn(color="primary", @click="calculate", :loading="loading") Calculate
    v-container
      h3.text-center Results
      v-row
        v-col.singles
          h4 Singles
          p Signal Count Rate: {{ results.signal_singles_rate }}
          p Idler Count Rate: {{ results.idler_singles_rate }}
        v-col.coincidences
          h4 Coincidences
          p Rate: {{ results.coincidences_rate }}
      v-row
        v-col.efficiency
          h4 Efficiencies
          p Signal Efficiency: {{ results.signal_efficiency }}
          p Idler Efficiency: {{ results.idler_efficiency }}
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import _debounce from 'lodash/debounce'

import CreateWorker from '@/workers/spdcalc'
// new thread
const spdcalc = new CreateWorker()

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
  , mounted(){
  }
  , methods: {
    calculate: _debounce(function(){
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

<style lang="sass">
.heralding-calc
</style>
