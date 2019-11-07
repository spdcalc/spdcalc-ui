<template lang="pug">
v-card.heralding-v-waist-series
  v-toolbar(flat, dark, color="blue-grey darken-2", extended, dense)
    v-toolbar-title Heralding vs Waist Size
    v-spacer
    v-btn(
      @click="redraw"
      , :loading="loading"
      , icon
    )
      v-icon mdi-refresh
    v-toolbar-items

    v-btn(
      icon
      , color="red lighten-1"
      , @click="$emit('remove')"
    )
      v-icon mdi-close
    template(#extension)
      v-toolbar-items.props-toolbar
        ParameterInput(
          label="min"
          , v-model="xmin"
          , lazy
          , :sigfigs="2"
          , units="µm"
        )
        ParameterInput(
          label="max"
          , v-model="xmax"
          , lazy
          , :sigfigs="2"
          , units="µm"
        )
        ParameterInput(
          label="Steps"
          , v-model="xsteps"
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
  v-responsive(ref="plotWrap", :aspect-ratio="1")
    vue-plotly(ref="plot", v-if="chartData.length", v-bind="chart", :data="chartData", @relayout="onRelayout")
    v-container(v-else, fill-height)
      v-row(align="center", justify="center", fill-height)
        v-col(cols="1")
          v-progress-circular(indeterminate, color="blue-grey", size="70")
</template>

<script>
import { mapGetters } from 'vuex'
import d3 from 'd3'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import VuePlotly from '@statnett/vue-plotly'
import ParameterInput from '@/components/inputs/parameter-input'
import CreateWorker from '@/workers/spdcalc'
// new thread
const spdcalc = new CreateWorker()

export default {
  name: 'heralding-v-waist-series'
  , props: {
    color: {
      type: String
      , default: '#34495e'
    }
  }
  , data: () => ({
    loading: false
    , xsteps: 10
    , xmin: 0
    , xmax: 130
    , resolution: 20
    , data: null
    , xAxisData: []
    , resizeCount: 0
  })
  , components: {
    VuePlotly
    , ParameterInput
  }
  , computed: {
    chart(){
      // hack for resize
      this.resizeCount // eslint-disable-line no-unused-expressions
      let dim = this.$refs.plotWrap ? this.$refs.plotWrap.$el.offsetWidth : 500

      return {
        options: {
          responsive: true
          , displaylogo: false
          // , showLink: true
          , displayModeBar: true
          // , modeBarButtons: [['zoom2d', 'pan2d']]
        }
        , layout: {
          margin: {
            t: 80
            , r: 65
            , l: 65
            , b: 65
            , pad: 0
          }
          , width: dim
          , height: dim
          , xaxis: {
            title: 'Waist Size (µm)'
            , showgrid: false
            , zeroline: false
            , ticklen: 10
            , ticks: 'inside'
            , rangemode: 'tozero'
          }
          , yaxis: {
            title: 'Efficiency'
            , showgrid: false
            , ticklen: 10
            , ticks: 'inside'
            , zeroline: false
            // , showline: true
            // , automargin: true
          }
          , yaxis2: {
            title: 'Counts / s'
            , showgrid: false
            , ticklen: 10
            , ticks: 'inside'
            , overlaying: 'y'
            , side: 'right'
          }
          , legend: {
            showlegend: true
            , xanchor: 'center'
            , yanchor: 'bottom'
            , x: 0.5
            , y: 1
            , orientation: 'h'
          }
        }
        , autoResize: true
      }
    }
    , chartData(){
      return this.data ? [{
        x: this.xAxisData
        , y: this.data.map(r => r.signal_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Signal'
      }, {
        x: this.xAxisData
        , y: this.data.map(r => r.idler_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Idler'
      }, {
        x: this.xAxisData
        , y: this.data.map(r => r.coincidences_rate)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Coincidences'
        , yaxis: 'y2'
      }] : []
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
  }
  , created(){
    this.calculate = _debounce(this.calculate.bind(this), 500)
  }
  , mounted(){

    const resize = _debounce(() => {
      this.resizeCount++
    }, 200)

    window.addEventListener('resize', resize, { passive: true })

    const unwatch = this.$store.watch(
      (state, getters) => getters['parameters/isReady'] &&
        !getters['parameters/isEditing'] &&
        ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , ( refresh ) => refresh && this.redraw()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
      window.removeEventListener('resize', resize)
    })
  }
  , watch: {
    'xsteps': 'redraw'
    , 'xmin': 'redraw'
    , 'xmax': 'redraw'
    , 'resolution': 'redraw'
  }
  , methods: {
    redraw(){
      this.calculate()
    }
    , getXAxisData(){
      const steps = this.xsteps
      const stepper = d3.interpolateNumber(this.xmin, this.xmax)
      return _times(steps, n => stepper(n / steps))
    }
    , calculate(){
      this.loading = true
      spdcalc.getHeraldingResultsVsWaist(
        this.spdConfig
        , { ...this.integrationConfig, size: this.resolution }
        , [this.xmin, this.xmax, this.xsteps | 0]
      ).then( seriesData => {
        this.data = seriesData
        this.xAxisData = this.getXAxisData()
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating Heralding vs waist plot' })
      }).finally(() => {
        setTimeout(() => {
          this.loading = false
        }, 100)
      })
    }
    , onRelayout(layout){
      if (
        !this.loading &&
        layout['xaxis.range[0]'] &&
        (layout['xaxis.range[0]'] !== this.xmin ||
        layout['xaxis.range[1]'] !== this.xmax)
      ){
        this.xmin = Math.max(0, layout['xaxis.range[0]'])
        this.xmax = layout['xaxis.range[1]']

        this.calculate()
      }
    }
  }
}
</script>

<style lang="sass">
.heralding-v-waist-series
  .ctrl
    position: absolute
    top: 1em
    left: 1em
    z-index: 2
  .switch
    padding: 20px 8px
  .js-plotly-plot .plotly .modebar
    top: 14px
    right: 14px
.props-toolbar
  height: 38px
  justify-content: space-between
  > *
    margin-left: 6px
    &:first-child
      margin-left: inherit
</style>
