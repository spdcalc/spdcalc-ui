<template lang="pug">
SPDPanel(
  title="Heralding vs Waist Size"
  , @refresh="redraw"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="1"
)
  template(#secondary-toolbar)
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
  SPDLinePlot(
    :chart-data="chartData"
    , xTitle="Waist Size (µm)"
    , yTitle="Efficiency"
    , y2Title="Counts / s"
    , @relayout="onRelayout"
  )
</template>

<script>
import { mapGetters } from 'vuex'
import SPDPanel from '@/components/spd-panel'
import SPDLinePlot from '@/components/spd-line-plot'
import ParameterInput from '@/components/inputs/parameter-input'
import d3 from 'd3'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import colors from 'vuetify/lib/util/colors'
import CreateWorker from '@/workers/spdcalc'
// new thread
const spdcalc = new CreateWorker()

export default {
  name: 'heralding-v-waist-series'
  , props: {
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
    SPDPanel
    , SPDLinePlot
    , ParameterInput
  }
  , computed: {
    chartData(){
      return this.data ? [{
        x: this.xAxisData
        , y: this.data.map(r => r.signal_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Signal'
        , spline: {
          color: colors.blueGrey.darken2
        }
        , marker: {
          color: colors.blueGrey.darken2
        }
      }, {
        x: this.xAxisData
        , y: this.data.map(r => r.idler_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Idler'
        , spline: {
          color: colors.orange.darken1
        }
        , marker: {
          color: colors.orange.darken1
        }
      }, {
        x: this.xAxisData
        , y: this.data.map(r => r.coincidences_rate)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Coincidences'
        , yaxis: 'y2'
        , spline: {
          color: colors.green.base
        }
        , marker: {
          color: colors.green.base
        }
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
    const unwatch = this.$store.watch(
      (state, getters) => getters['parameters/isReady'] &&
        !getters['parameters/isEditing'] &&
        ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , ( refresh ) => refresh && this.redraw()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
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
</style>
