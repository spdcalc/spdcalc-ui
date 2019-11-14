<template lang="pug">
SPDPanel(
  :title="'Heralding Efficiency ' + titleVs"
  , @refresh="redraw"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="2"
)
  template(#secondary-toolbar)
    v-toolbar-items.props-toolbar
      ParameterInput(
        label="xmin"
        , v-model="waistRanges.x_range[0]"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="xmax"
        , v-model="waistRanges.x_range[1]"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="ymin"
        , v-model="waistRanges.y_range[0]"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="ymax"
        , v-model="waistRanges.y_range[1]"
        , lazy
        , :sigfigs="2"
      )
    v-toolbar-items.props-toolbar
      ParameterInput(
        label="Grid Size"
        , v-model="steps"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="JSI Resolution"
        , v-model="resolution"
        , step="1"
        , :sigfigs="0"
        , tooltip="The grid size of the JSA integration"
        , lazy
      )
  SPDHistogram(
    :chart-data="data"
    , :axes="axes"
    , :log-scale="enableLogScale"
    , :x-title="xTitle"
    , :y-title="yTitle"
    , :usegl="false"
    , @relayout="onRelayout"
  )
</template>

<script>
import { mapGetters } from 'vuex'
import SPDPanel from '@/components/spd-panel'
import SPDHistogram from '@/components/plots/spd-histogram'
import ParameterInput from '@/components/inputs/parameter-input'
import { createGroupedArray } from '@/lib/data-utils'
import { BatchWorker, partitionSteps } from '@/lib/batch-worker'
import CreateWorker from '@/workers/spdcalc'

const batch = BatchWorker(() => new CreateWorker())
// new thread
// const spdcalc = new CreateWorker()

const modes = ['signal-vs-idler', 'pump-vs-signal']
export default {
  name: 'heralding-histogram-waists'
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
    , enableLogScale: false
    , waistRanges: {
      x_range: [0, 300]
      , y_range: [0, 150]
      , x_count: 20
      , y_count: 20
    }
    , steps: 20
    , resolution: 10
    , heraldingResults: []
  })
  , watch: {
    steps(){
      let x_count = this.steps | 0 // eslint-disable-line
      let y_count = this.steps | 0 // eslint-disable-line

      this.calculate({
        ...this.waistRanges
        , x_count
        , y_count
      })
    }
  }
  , components: {
    SPDPanel
    , SPDHistogram
    , ParameterInput
  }
  , computed: {
    titleVs(){
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
    , axes(){
      let cfg = this.waistRanges
      let x0 = cfg.x_range[0]
      let dx = (cfg.x_range[1] - x0) / (cfg.x_count - 1)
      let y0 = cfg.y_range[0]
      let dy = (cfg.y_range[1] - y0) / (cfg.y_count - 1)
      return {
        x0
        , dx
        , y0
        , dy
      }
    }
    , data(){
      return createGroupedArray(
        Float64Array.from(this.heraldingResults, r => r.signal_efficiency)
        , this.waistRanges.x_count
      )
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
  }
  , mounted(){
    this.calculate()
  }
  , methods: {
    redraw(){
      this.calculate()
    }
    , calculate( ranges ){
      ranges = ranges || this.waistRanges
      this.loading = true
      this.runBatch(ranges).then( heraldingResults => {
        this.heraldingResults = heraldingResults
        this.waistRanges = ranges
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating heralding efficiency histogram' })
      }).finally(() => {
        setTimeout(() => {
          this.loading = false
        }, 100)
      })
    }
    , runBatch(ranges){
      // return batch.workers[0].getHeraldingResultsSignalVsIdlerWaists(
      //   this.spdConfig
      //   , { ...this.integrationConfig, size: this.resolution }
      //   , ranges
      // )
      let partitions = partitionSteps(ranges.y_range, ranges.y_count, batch.length)
      let args = partitions.map((p) => {
        let batchRange = {
          ...ranges
          , y_range: p.range
          , y_count: p.count
        }

        return [
          this.spdConfig
          , { ...this.integrationConfig, size: this.resolution }
          , batchRange
        ]
      })

      let method = this.mode === 'signal-vs-idler'
        ? 'getHeraldingResultsSignalVsIdlerWaists'
        : 'getHeraldingResultsPumpVsSignalIdlerWaists'

      return batch.execAndConcat(
        method
        , args
      )
    }
    , onRelayout(layout){
      if (this.loading){ return }

      // eslint-disable-next-line
      let { x_range, y_range } = this.waistRanges

      let xchanged = layout['xaxis.range[0]'] &&
        (layout['xaxis.range[0]'] !== x_range[0] ||
        layout['xaxis.range[1]'] !== x_range[1])

      let ychanged = layout['yaxis.range[0]'] &&
        (layout['yaxis.range[0]'] !== y_range[0] ||
        layout['yaxis.range[1]'] !== y_range[1])

      if ( !xchanged && !ychanged ){ return }

      if (xchanged){
        // eslint-disable-next-line
        x_range = [
          Math.max(0, layout['xaxis.range[0]'])
          , layout['xaxis.range[1]']
        ]
      }

      if (ychanged){
        // eslint-disable-next-line
        y_range = [
          Math.max(0, layout['yaxis.range[0]'])
          , layout['yaxis.range[1]']
        ]
      }

      let ranges = {
        ...this.waistRanges
        , x_range
        , y_range
      }

      this.calculate(ranges)
    }
  }
}
</script>

<style lang="sass">
</style>
