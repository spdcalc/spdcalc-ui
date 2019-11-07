<template lang="pug">
v-card
  v-toolbar(flat, dark, color="blue-grey darken-2", extended, dense, extension-height="80")
    v-toolbar-title Heralding Efficiency
    v-spacer
    v-btn(
      @click="redraw"
      , :loading="loading"
      , icon
    )
      v-icon mdi-refresh
    v-btn(
      icon
      , color="red lighten-1"
      , @click="$emit('remove')"
    )
      v-icon mdi-close
    template(#extension)
      .flex-column.flex-wrap
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
            label="Steps"
            , v-model="steps"
            , step="1"
            , :sigfigs="0"
            , lazy
          )
          ParameterInput(
            label="Resolution"
            , v-model="resolution"
            , step="1"
            , :sigfigs="0"
            , tooltip="The grid size of the JSA integration"
            , lazy
          )
  Histogram(
    :chart-data="data"
    , :axes="axes"
    , :log-scale="enableLogScale"
    , x-title="Signal waist (µm)"
    , y-title="Idler waist (µm)"
    , :usegl="false"
    , @relayout="onRelayout"
  )
</template>

<script>
import { mapGetters } from 'vuex'
import Histogram from '@/components/plots/histogram'
import ParameterInput from '@/components/inputs/parameter-input'
import { createGroupedArray } from '@/lib/data-utils'
import CreateWorker from '@/workers/spdcalc'
// new thread
const spdcalc = new CreateWorker()

export default {
  name: 'heralding-signal-vs-idler-waist'
  , data: () => ({
    loading: false
    , enableLogScale: false
    , waistRanges: {
      x_range: [50, 300]
      , y_range: [50, 150]
      , x_count: 5
      , y_count: 5
    }
    , steps: 5
    , resolution: 20
    , heraldingResults: []
  })
  , watch: {
    steps(){
      let x_count = this.steps | 0
      let y_count = this.steps | 0

      this.calculate({
        ...this.waistRanges
        , x_count
        , y_count
      })
    }
  }
  , components: {
    Histogram
    , ParameterInput
  }
  , computed: {
    axes(){
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
      spdcalc.getHeraldingResultsSignalVsIdlerWaists(
        this.spdConfig
        , { ...this.integrationConfig, size: this.resolution }
        , ranges
      ).then( heraldingResults => {
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
    , onRelayout(layout){
      if (this.loading){ return }

      let { x_range, y_range } = this.waistRanges

      let xchanged = layout['xaxis.range[0]'] &&
        (layout['xaxis.range[0]'] !== x_range[0] ||
        layout['xaxis.range[1]'] !== x_range[1])

      let ychanged = layout['yaxis.range[0]'] &&
        (layout['yaxis.range[0]'] !== y_range[0] ||
        layout['yaxis.range[1]'] !== y_range[1])

      if ( !xchanged && !ychanged ){ return }

      if (xchanged){
        x_range = [
          Math.max(0, layout['xaxis.range[0]'])
          , layout['xaxis.range[1]']
        ]
      }

      if (ychanged){
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
