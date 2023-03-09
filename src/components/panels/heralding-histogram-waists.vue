<template lang="pug">
SPDPanel(
  :title="'Heralding Efficiency ' + titleVs"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
  , toolbar-rows="3"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="xmin"
        , v-model="xmin"
        , :warningMsg="xmin < minXValidWaistSize ? waistSizeWarning : undefined"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="xmax"
        , v-model="panelSettings.waistRanges.x_range[1]"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="ymin"
        , v-model="ymin"
        , :warningMsg="ymin < minYValidWaistSize ? waistSizeWarning : undefined"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="ymax"
        , v-model="panelSettings.waistRanges.y_range[1]"
        , lazy
        , :sigfigs="2"
      )
    .props-toolbar
      ParameterInput(
        label="Grid Size"
        , v-model="steps"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="JSI Resolution"
        , v-model="panelSettings.resolution"
        , step="1"
        , :sigfigs="0"
        , tooltip="The grid size of the JSA integration"
        , lazy
      )
    .props-toolbar
      ParameterSelector(
        v-model="panelSettings.zType"
        , :items="zTypes"
      )
  SPDHistogram(
    :chart-data="data"
    , :axes="axes"
    , :x-title="xTitle"
    , :y-title="yTitle"
    , :usegl="false"
    , :zrange="zrange"
    , @updatedView="plotView = $event"
  )
    template(#chart-bar)
      IconButton(
        v-if="plotView"
        , icon="mdi-target-variant"
        , tooltip="compute data over current plot view"
        , @click="applyRange"
      )
</template>

<script>
import { mapGetters } from 'vuex'
import panelMixin from '@/components/panel.mixin'
import SPDHistogram from '@/components/spd-histogram.vue'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import { createGroupedArray } from '@/lib/data-utils'
import { waistSizeWarning } from '@/text'
import { interruptDebounce } from '../../lib/batch-worker'
import _max from 'lodash/max'
import _min from 'lodash/min'

function sigfigs(n, f){
  return +n.toPrecision(Math.log10(n) + f + 1)
}

const PLOT_TYPE_MAPPERS = {
  symmetric: r => r.symmetric_efficiency
  , signal: r => r.signal_efficiency
  , idler: r => r.idler_efficiency
  , signal_rates: r => r.signal_singles_rate
  , idler_rates: r => r.idler_singles_rate
  , coincidences_rates: r => r.coincidences_rate
}

const modes = ['signal-vs-idler', 'pump-vs-signal']
export default {
  name: 'heralding-histogram-waists'
  , mixins: [panelMixin]
  , props: {
    mode: {
      type: String
      , default: 'signal-vs-idler'
      , validator(v){
        return modes.indexOf(v) > -1
      }
    }
  }
  , data: () => ({
    loading: false
    , waistSizeWarning
    , zTypes: [
      {
        text: 'Schmidt Number'
        , value: 'schmidt'
      }
      , {
        text: 'Symmetric Efficiency'
        , value: 'symmetric'
      }
      , {
        text: 'Signal Efficiency'
        , value: 'signal'
      }, {
        text: 'Idler Efficiency'
        , value: 'idler'
      }, {
        text: 'Coincidence Rates'
        , value: 'coincidences_rates'
      }, {
        text: 'Signal Singles Rates'
        , value: 'signal_rates'
      }, {
        text: 'Idler Singles Rates'
        , value: 'idler_rates'
      }
    ]
    , panelSettings: {
      waistRanges: {
        x_range: [20, 200] // ['auto', 300]
        , y_range: [20, 150] // ['auto', 150]
        , x_count: 10
        , y_count: 10
      }
      , resolution: 30
      , zType: 'schmidt'
    }
    , plotView: null
    , schmidtResults: []
    , heraldingResults: []
  })
  , components: {
    SPDHistogram
    , ParameterInput
  }
  , watch: {
    'xmin': 'checkRecalculate'
    , 'panelSettings.waistRanges.x_range.1': 'checkRecalculate'
    , 'ymin': 'checkRecalculate'
    , 'panelSettings.waistRanges.y_range.1': 'checkRecalculate'
    , 'steps': 'checkRecalculate'
    , 'panelSettings.resolution': 'checkRecalculate'
  }
  , computed: {
    xmin: {
      get(){
        return this.panelSettings.waistRanges.x_range[0] === 'auto' ? this.minXValidWaistSize : this.panelSettings.waistRanges.x_range[0]
      }
      , set(v){
        let xmax = this.panelSettings.waistRanges.x_range[1]
        this.panelSettings.waistRanges.x_range = [+v, xmax]
      }
    }
    , ymin: {
      get(){
        return this.panelSettings.waistRanges.y_range[0] === 'auto' ? this.minYValidWaistSize : this.panelSettings.waistRanges.y_range[0]
      }
      , set(v){
        let ymax = this.panelSettings.waistRanges.y_range[1]
        this.panelSettings.waistRanges.y_range = [+v, ymax]
      }
    }
    , ranges(){
      let r = this.panelSettings.waistRanges
      return {
        ...r
        , x_range: [this.xmin, r.x_range[1]]
        , y_range: [this.ymin, r.y_range[1]]
      }
    }
    , minXValidWaistSize(){
      return this.mode === 'signal-vs-idler'
        ? sigfigs(this.minSignalWaistSize, 2)
        : sigfigs(this.minPumpWaistSize, 2)
    }
    , minYValidWaistSize(){
      return this.mode === 'signal-vs-idler'
        ? sigfigs(this.minIdlerWaistSize, 2)
        : sigfigs(Math.max(
          this.minSignalWaistSize
          , this.minIdlerWaistSize
        ), 2)
    }
    , steps: {
      get(){ return this.panelSettings.waistRanges.x_count }
      , set(s){
        this.panelSettings.waistRanges.x_count = s | 0
        this.panelSettings.waistRanges.y_count = s | 0
      }
    }
    , titleVs(){
      return this.mode === 'signal-vs-idler'
        ? '(Ws vs Wi)'
        : '(Wp vs Ws/Wi)'
    }
    , xTitle(){
      return this.mode === 'signal-vs-idler'
        ? 'Signal waist (µm)'
        : 'Pump waist (µm)'
    }
    , yTitle(){
      return this.mode === 'signal-vs-idler'
        ? 'Idler waist (µm)'
        : 'Signal/Idler waists (µm)'
    }
    , zrange() {
      if (this.panelSettings.zType === 'schmidt'){
        const max = _max(this.schmidtResults)
        const min = _min(this.schmidtResults)
        return [min, max]
      }
      if (this.panelSettings.zType.includes('rate')){
        const max = _max(this.pluckedData)
        return [0, max]
      }
      return [0, 1]
    }
    , axes() {
      let cfg = this.panelSettings.waistRanges
      let x0 = this.xmin
      let dx = (cfg.x_range[1] - x0) / (cfg.x_count - 1)
      let y0 = this.ymin
      let dy = (cfg.y_range[1] - y0) / (cfg.y_count - 1)
      return {
        x0
        , dx
        , y0
        , dy
      }
    }
    , pluckedData() {
      let zType = this.panelSettings.zType
      if (zType === 'schmidt'){
        return this.schmidtResults
      }
      const calc = PLOT_TYPE_MAPPERS[zType]
      return Float64Array.from(this.heraldingResults, calc)
    }
    , data(){
      return createGroupedArray(
        this.pluckedData
        , this.steps
      )
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
      , 'minPumpWaistSize'
      , 'minSignalWaistSize'
      , 'minIdlerWaistSize'
    ])
  }
  , created(){
    this.$on('parametersUpdated', () => this.calculate())
  }
  , methods: {
    redraw(){
      if ( !this.panelSettings.autoUpdate ){ return }
      this.calculate()
    }
    , async calculate(){
      this.loading = true
      try {
        const durations = await Promise.all([
          this.calculateSchmidt(),
          this.calculateHeralding()
        ])
        const duration = durations.reduce((s, i) => s + i, 0)
        this.status = `done in ${duration.toFixed(2)}ms`
      } finally {
        this.loading = false
      }
    }
    , async calculateSchmidt(){
      const ranges = this.ranges
      this.schmidtResults = []
      try {
        let method = this.mode === 'signal-vs-idler'
          ? 'getSchmidtIdlerWaistVsSignalWaist'
          : 'getSchmidtSignalWaistVsPumpWaist'
        const { result, duration } = await this.spdWorkers.execSingle(
          method
          , this.spdConfig
          , { ...this.integrationConfig, size: this.panelSettings.resolution }
          , ranges
        )
        this.schmidtResults = result
        return duration
      } catch (error) {
        this.$store.dispatch('error', { error, context: 'while calculating schmidt histogram' })
        throw error
      }
    }
    , async calculateHeralding(){
      const ranges = this.ranges
      this.heraldingResults = []
      try {
        const { result, duration } = await this.runBatch(ranges)
        this.heraldingResults = result
        return duration
      } catch ( error ) {
        this.$store.dispatch('error', { error, context: 'while calculating heralding efficiency histogram' })
        throw error
      }
    }
    , runBatch: interruptDebounce(function (ranges) {
      // return batch.workers[0].getHeraldingResultsSignalVsIdlerWaists(
      //   this.spdConfig
      //   , { ...this.integrationConfig, size: this.resolution }
      //   , ranges
      // )
      let partitions = this.spdWorkers.partitionSteps(ranges.y_range, ranges.y_count)
      let args = partitions.map((p) => {
        let batchRange = {
          ...ranges
          , y_range: p.range
          , y_count: p.count
        }

        return [
          this.spdConfig
          , { ...this.integrationConfig, size: this.panelSettings.resolution }
          , batchRange
        ]
      })

      let method = this.mode === 'signal-vs-idler'
        ? 'getHeraldingResultsSignalVsIdlerWaists'
        : 'getHeraldingResultsPumpVsSignalIdlerWaists'

      return this.spdWorkers.execAndConcat(
        method
        , args
      )
    })
    , applyRange(){
      this.panelSettings.waistRanges.x_range = this.plotView.xRange
      this.panelSettings.waistRanges.y_range = this.plotView.yRange
    }
  }
}
</script>

<style lang="sass">
</style>
