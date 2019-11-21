<template lang="pug">
SPDPanel(
  title="Heralding vs Waist Size"
  , @refresh="redraw"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="1"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
  , :size="2"
)
  template(#secondary-toolbar)
    v-toolbar-items.props-toolbar
      ParameterInput(
        label="min"
        , v-model="panelSettings.xaxis.min"
        , lazy
        , :sigfigs="2"
        , units="µm"
      )
      ParameterInput(
        label="max"
        , v-model="panelSettings.xaxis.max"
        , lazy
        , :sigfigs="2"
        , units="µm"
      )
      ParameterInput(
        label="Steps"
        , v-model="panelSettings.xaxis.steps"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="Resolution"
        , v-model="panelSettings.jsiResolution"
        , step="1"
        , :sigfigs="0"
        , tooltip="The grid size of the JSA integration"
        , lazy
      )
  v-row(no-gutters)
    SPDCol
      SPDLinePlot(
        :plotly-config="plotlyConfig"
        , :chart-data="chartData"
        , xTitle="Waist Size (µm)"
        , yTitle="Efficiency"
        , y2Title="Counts / s"
        , @updatedView="plotView = $event"
      )
        template(#chart-bar)
          IconButton(
            v-if="plotView"
            , icon="mdi-target-variant"
            , tooltip="compute data over current plot view"
            , @click="applyRange"
          )
      v-slider.waist-slider(
        v-model="waistSliderVal"
        , :step="0.01"
      )
    SPDCol
      SPDHistogram(
        :chart-data="coincidencesNormalized"
        , :axes="axes"
        , :usegl="false"
        , :log-scale="panelSettings.coincLogScale"
        , x-title="Signal wavelength (nm)"
        , y-title="Idler wavelength (nm)"
      )
      template(#chart-bar)
        v-spacer
        IconButton(
          icon="mdi-math-log"
          , @click="panelSettings.coincLogScale = !panelSettings.coincLogScale"
          , tooltip="toggle log scale"
          , :color="enableLogScale ? 'yellow' : ''"
        )
    SPDCol
      SPDHistogram(
        :chart-data="singlesSignalNormalized"
        , :axes="axes"
        , :usegl="false"
        , :log-scale="panelSettings.singlesSignalLogScale"
        , x-title="Signal wavelength (nm)"
        , y-title="Idler wavelength (nm)"
      )
      template(#chart-bar)
        v-spacer
        IconButton(
          icon="mdi-math-log"
          , @click="panelSettings.singlesSignalLogScale = !panelSettings.singlesSignalLogScale"
          , tooltip="toggle log scale"
          , :color="enableLogScale ? 'yellow' : ''"
        )
    SPDCol
      SPDHistogram(
        :chart-data="singlesIdlerNormalized"
        , :axes="axes"
        , :usegl="false"
        , :log-scale="panelSettings.singlesIdlerLogScale"
        , x-title="Signal wavelength (nm)"
        , y-title="Idler wavelength (nm)"
      )
      template(#chart-bar)
        v-spacer
        IconButton(
          icon="mdi-math-log"
          , @click="panelSettings.singlesIdlerLogScale = !panelSettings.singlesIdlerLogScale"
          , tooltip="toggle log scale"
          , :color="enableLogScale ? 'yellow' : ''"
        )
</template>

<script>
import { mapGetters } from 'vuex'
import Promise from 'bluebird'
import panelMixin from '@/components/panel.mixin'
import SPDLinePlot from '@/components/spd-line-plot'
import SPDHistogram from '@/components/spd-histogram'
import { createGroupedArray } from '@/lib/data-utils'
import _debounce from 'lodash/debounce'
import _max from 'lodash/max'
import colors from 'vuetify/lib/util/colors'

export default {
  name: 'heralding-v-waist-series'
  , mixins: [panelMixin]
  , props: {
  }
  , data: () => ({
    panelSettings: {
      xaxis: {
        min: 0
        , max: 130
        , steps: 10
      }
      , jsiResolution: 30
    }
    , plotView: null
    , data: null
    , axes: {}
    , waistSize: 60
    , coincidencesNormalized: []
    , singlesSignalNormalized: []
    , singlesIdlerNormalized: []
    , xAxisData: []
    , plotlyConfig: {
      watchShallow: true
      , layout: {
        yaxis2: {
          titlefont: {
            color: colors.green.darken2
          }
          , tickfont: {
            color: colors.green.darken2
          }
        }
        , shapes: [
          {
            type: 'line'
            , x0: 60
            , x1: 60
            , y0: 0
            , y1: 1
            , line: {
              color: colors.grey.base
              , width: 3
              , dash: 'dot'
            }
          }
        ]
      }
    }
  })
  , components: {
    SPDLinePlot
    , SPDHistogram
  }
  , computed: {
    waistSliderVal: {
      get(){
        return this.waistSize
      }
      , set( v ){
        this.waistSize = +v
        let line = this.plotlyConfig.layout.shapes[0]
        line.x0 = v
        line.x1 = v
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
    , integrationConfig(){
      const size = this.panelSettings.jsiResolution
      return { ...this.integrationConfigOriginal, size }
    }
    , spdConfig(){
      const waist = this.waistSize
      return { ...this.spdConfigOriginal, signal_waist: waist, idler_waist: waist }
    }
    , ...mapGetters('parameters', {
      'spdConfigOriginal': 'spdConfig'
      , 'integrationConfigOriginal': 'integrationConfig'
    })
  }
  , created(){
    this.$on('parametersUpdated', () => this.redraw())
  }
  , watch: {
    panelSettings: 'redraw'
    , waistSize: _debounce(function(){
      this.loading = true
      this.calcJSIs().finally(() => { this.loading = false })
    }, 100)
  }
  , methods: {
    redraw(){
      this.calculate()
    }
    , getXAxisData(){
      const xaxis = this.panelSettings.xaxis
      return this.getStepArray(xaxis.min, xaxis.max, xaxis.steps)
    }
    , calculate(){
      this.loading = true
      Promise.all([
        this.calculateSeries()
        , this.calcJSIs()
      ]).then(durations => {
        let duration = _max(durations)
        this.status = `done in ${duration.toFixed(2)}ms`
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating Heralding vs waist plot' })
      }).finally(() => {
        this.loading = false
      })
    }
    , calcJSIs(){
      let dim = this.integrationConfig.size
      this.coincidencesNormalized = []
      this.singlesSignalNormalized = []
      this.singlesIdlerNormalized = []
      return Promise.all([
        this.calculateCoincidences()
        , this.calculateSinglesSignal()
        , this.calculateSinglesIdler()
      ]).then(durations => {
        this.normalizeData(dim)
        let duration = _max(durations)
        this.status = `done in ${duration.toFixed(2)}ms`
        return duration
      })
    }
    , normalizeData(dim){
      let n = dim * dim
      let coinc = this.coincidences
      let sig = this.singlesSignal
      let idl = this.singlesIdler
      let maxSignal = _max(sig)
      let maxIdler = _max(idl)
      let norm = Math.max(maxSignal, maxIdler)

      for (let i = 0; i < n; i++){
        coinc[i] = coinc[i] / norm
        sig[i] = sig[i] / norm
        idl[i] = idl[i] / norm
      }

      this.coincidencesNormalized = createGroupedArray(coinc, dim)
      this.singlesSignalNormalized = createGroupedArray(sig, dim)
      this.singlesIdlerNormalized = createGroupedArray(idl, dim)
    }
    , getAxes(){
      let cfg = this.integrationConfig
      let x0 = cfg.ls_min
      let dx = (cfg.ls_max - x0) / (cfg.size - 1)
      let y0 = cfg.li_min
      let dy = (cfg.li_max - y0) / (cfg.size - 1)
      return {
        x0
        , dx
        , y0
        , dy
      }
    }
    , calculateCoincidences(){
      return this.spdWorkers.execSingle(
        'getJSICoincNormalizedToSingles'
        , this.spdConfig
        , this.integrationConfig
      ).then( ({ result, duration }) => {
        this.coincidences = result
        this.axes = this.getAxes()
        return duration
      })
    }
    , calculateSinglesSignal(){
      return this.spdWorkers.execSingle(
        'getJSISinglesSignal'
        , this.spdConfig
        , this.integrationConfig
      ).then( ({ result, duration }) => {
        this.singlesSignal = result
        this.axes = this.getAxes()
        return duration
      })
    }
    , calculateSinglesIdler(){
      return this.spdWorkers.execSingle(
        'getJSISinglesIdler'
        , this.spdConfig
        , this.integrationConfig
      ).then( ({ result, duration }) => {
        this.singlesIdler = result
        this.axes = this.getAxes()
        return duration
      })
    }
    , calculateSeries(){
      const xaxis = this.panelSettings.xaxis
      return this.spdWorkers.execSingle(
        'getHeraldingResultsVsWaist'
        , this.spdConfig
        , { ...this.integrationConfig, size: this.panelSettings.jsiResolution }
        , [xaxis.min, xaxis.max, xaxis.steps | 0]
      ).then( ({ result, duration }) => {
        this.data = result
        this.xAxisData = this.getXAxisData()
        return duration
      })
    }
    , applyRange(){
      const xRange = this.plotView.xRange
      this.panelSettings.xaxis = {
        min: xRange[0]
        , max: xRange[1]
        , steps: this.panelSettings.xaxis.steps
      }
    }
  }
}
</script>

<style lang="sass" scoped>
.waist-slider
  margin-right: 60px
  margin-left: 62px
</style>
