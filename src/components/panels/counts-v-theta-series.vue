<template lang="pug">
SPDPanel(
  title="Counts vs Beam Theta"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
  , :size="2"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="min"
        , v-model="xmin"
        , lazy
        , :sigfigs="2"
        , units="°"
      )
      ParameterInput(
        label="max"
        , v-model="panelSettings.xaxis.max"
        , :max="90"
        , lazy
        , :sigfigs="2"
        , units="°"
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
        :plotly-config="signalSeries.plotlyConfigCountsChart"
        , :chart-data="countsChartSignalSeriesData"
        , xTitle="Signal Angle (degrees)"
        , yTitle="Counts / s"
        , @updatedView="plotView = $event"
      )
        template(#chart-bar)
          IconButton(
            v-if="plotView"
            , icon="mdi-target-variant"
            , tooltip="compute data over current plot view"
            , @click="applyRange"
          )
      //- SPDLinePlot(
      //-   ref="effPlot"
      //-   , :plotly-config="signalSeries.plotlyConfigEfficiencyChart"
      //-   , :chart-data="efficiencyChartSignalSeriesData"
      //-   , xTitle="Signal Angle (degrees)"
      //-   , yTitle="Efficiency"
      //-   , :aspect-ratio="2/1"
      //-   , @updatedView="plotView = $event"
      //-   , @restyle="onEfficiencySignalSeriesRestyle"
      //- )

      .heralding-result-text(v-if="signalSeries.heraldingResults").
        <abbr title="coincidence count rate">R<sub>c</sub></abbr>: {{ signalSeries.heraldingResults.coincidences_rate.toFixed(4) }} |
        <abbr title="signal singles count rate">R<sub>ss</sub></abbr>: {{ signalSeries.heraldingResults.signal_singles_rate.toFixed(4) }}
        <abbr title="idler singles count rate">R<sub>si</sub></abbr>: {{ signalSeries.heraldingResults.idler_singles_rate.toFixed(4) }}
        <br/>
        <abbr title="signal efficiency">&eta;<sub>s</sub></abbr>: {{ signalSeries.heraldingResults.signal_efficiency.toFixed(4) }} |
        <abbr title="idler efficiency">&eta;<sub>i</sub></abbr>: {{ signalSeries.heraldingResults.idler_efficiency.toFixed(4) }}
      v-slider.theta-slider(
        v-model="signalThetaSliderVal"
        , :min="xmin"
        , :max="panelSettings.xaxis.max"
        , :step="0.01"
      )
    SPDCol
      SPDLinePlot(
        :plotly-config="idlerSeries.plotlyConfigCountsChart"
        , :chart-data="countsChartIdlerSeriesData"
        , xTitle="Idler Angle (degrees)"
        , yTitle="Counts / s"
        , @updatedView="plotView = $event"
      )
        template(#chart-bar)
          IconButton(
            v-if="plotView"
            , icon="mdi-target-variant"
            , tooltip="compute data over current plot view"
            , @click="applyRange"
          )
      //- SPDLinePlot(
      //-   ref="effPlot"
      //-   , :plotly-config="idlerSeries.plotlyConfigEfficiencyChart"
      //-   , :chart-data="efficiencyChartIdlerSeriesData"
      //-   , xTitle="Idler Angle (degrees)"
      //-   , yTitle="Efficiency"
      //-   , :aspect-ratio="2/1"
      //-   , @updatedView="plotView = $event"
      //-   , @restyle="onEfficiencyIdlerSeriesRestyle"
      //- )

      .heralding-result-text(v-if="idlerSeries.heraldingResults").
        <abbr title="coincidence count rate">R<sub>c</sub></abbr>: {{ idlerSeries.heraldingResults.coincidences_rate.toFixed(4) }} |
        <abbr title="signal singles count rate">R<sub>ss</sub></abbr>: {{ idlerSeries.heraldingResults.signal_singles_rate.toFixed(4) }}
        <abbr title="idler singles count rate">R<sub>si</sub></abbr>: {{ idlerSeries.heraldingResults.idler_singles_rate.toFixed(4) }}
        <br/>
        <abbr title="signal efficiency">&eta;<sub>s</sub></abbr>: {{ idlerSeries.heraldingResults.signal_efficiency.toFixed(4) }} |
        <abbr title="idler efficiency">&eta;<sub>i</sub></abbr>: {{ idlerSeries.heraldingResults.idler_efficiency.toFixed(4) }}

      v-slider.theta-slider(
        v-model="idlerThetaSliderVal"
        , :min="xmin"
        , :max="panelSettings.xaxis.max"
        , :step="0.01"
      )
</template>

<script>
import { mapGetters } from 'vuex'
import Promise from 'bluebird'
import panelMixin from '@/components/panel.mixin'
import SPDLinePlot from '@/components/spd-line-plot'
import _debounce from 'lodash/debounce'
import _max from 'lodash/max'
import _cloneDeep from 'lodash/cloneDeep'
import spdColors from '@/spd-colors'

// const ZERO_HERALDING_RESULTS = {
//   signal_singles_rate: 0
//   , idler_singles_rate: 0
//   , coincidences_rate: 0
//   , signal_efficiency: 0
//   , idler_efficiency: 0
//   , symmetric_efficiency: 0
// }

const plotlyConfigEfficiencyChart = {
  watchShallow: true
  , layout: {
    margin: {
      b: 24
    }
    , xaxis: {
      title: false
    }
    , yaxis: {
      rangemode: 'tozero'
    }
    , shapes: [
      {
        type: 'line'
        , x0: 60
        , x1: 60
        , y0: 0
        , y1: 1
        , line: {
          color: spdColors.indicatorLine
          , width: 3
          , dash: 'dot'
        }
      }
    ]
  }
}

const plotlyConfigCountsChart = {
  options: {
    // displayModeBar: false
  }
  , layout: {
    margin: {
      t: 10
    }
    // , showlegend: false
    , xaxis: {}
    , yaxis: {
      rangemode: 'tozero'
    }
    , shapes: [
      {
        type: 'line'
        , x0: 60
        , x1: 60
        , y0: 0
        , y1: 1
        , line: {
          color: spdColors.indicatorLine
          , width: 3
          , dash: 'dot'
        }
      }
    ]
  }
}

export default {
  name: 'heralding-v-angle-series'
  , mixins: [panelMixin]
  , props: {
  }
  , data: () => ({
    panelSettings: {
      xaxis: {
        min: 0
        , max: 90
        , steps: 10
      }
      , jsiResolution: 30
    }
    , plotView: null
    , axes: {}
    , xAxisData: []
    , signalSeries: {
      countsChartDataVisibility: []
      , plotlyConfigEfficiencyChart: _cloneDeep(plotlyConfigEfficiencyChart)
      , plotlyConfigCountsChart: _cloneDeep(plotlyConfigCountsChart)
      , data: null
      , theta: 0
      , heraldingResults: null
    }
    , idlerSeries: {
      countsChartDataVisibility: []
      , plotlyConfigEfficiencyChart: _cloneDeep(plotlyConfigEfficiencyChart)
      , plotlyConfigCountsChart: _cloneDeep(plotlyConfigCountsChart)
      , data: null
      , theta: 0
      , heraldingResults: null
    }
  })
  , components: {
    SPDLinePlot
  }
  , computed: {
    xmin: {
      get(){
        return this.panelSettings.xaxis.min
      }
      , set(v){
        this.panelSettings.xaxis.min = +v
      }
    }
    , signalThetaSliderVal: {
      get(){
        return this.signalSeries.theta
      }
      , set( v ){
        this.signalSeries.theta = +v
        let line = this.signalSeries.plotlyConfigEfficiencyChart.layout.shapes[0]
        line.x0 = v
        line.x1 = v
        line = this.signalSeries.plotlyConfigCountsChart.layout.shapes[0]
        line.x0 = v
        line.x1 = v
        line.y1 = this.signalSeriesMaxCount
      }
    }
    , idlerThetaSliderVal: {
      get(){
        return this.idlerSeries.theta
      }
      , set( v ){
        this.idlerSeries.theta = +v
        let line = this.idlerSeries.plotlyConfigEfficiencyChart.layout.shapes[0]
        line.x0 = v
        line.x1 = v
        line = this.idlerSeries.plotlyConfigCountsChart.layout.shapes[0]
        line.x0 = v
        line.x1 = v
        line.y1 = this.idlerSeriesMaxCount
      }
    }
    , signalSeriesMaxCount(){
      if ( !this.countsChartSignalSeriesData.length ){ return 1 }
      return _max(this.countsChartSignalSeriesData[0].y.concat(this.countsChartSignalSeriesData[1].y))
    }
    , idlerSeriesMaxCount(){
      if ( !this.countsChartIdlerSeriesData.length ){ return 1 }
      return _max(this.countsChartIdlerSeriesData[0].y.concat(this.countsChartIdlerSeriesData[1].y))
    }
    , efficiencyChartSignalSeriesData(){
      return this.getEfficiencyChartData(this.signalSeries)
    }
    , countsChartSignalSeriesData(){
      return this.getCountsChartData(this.signalSeries)
    }
    , efficiencyChartIdlerSeriesData(){
      return this.getEfficiencyChartData(this.idlerSeries)
    }
    , countsChartIdlerSeriesData(){
      return this.getCountsChartData(this.idlerSeries)
    }
    , integrationConfig(){
      const size = this.panelSettings.jsiResolution
      return { ...this.integrationConfigOriginal, size }
    }
    , spdConfigVaryingSignal(){
      const theta = this.signalSeries.theta
      return { ...this.spdConfigOriginal, signal_theta: theta }
    }
    , spdConfigVaryingIdler(){
      const theta = this.idlerSeries.theta
      return { ...this.spdConfigOriginal, idler_theta: theta }
    }
    , ...mapGetters('parameters', {
      'spdConfigOriginal': 'spdConfig'
      , 'integrationConfigOriginal': 'integrationConfig'
    })
  }
  , created(){
    this.$on('parametersUpdated', () => this.calculate())
  }
  , mounted(){
    // set thetas based on parameters on load
    this.setSliderThetas()
  }
  , beforeDestroy(){
    if ( this._promise ){
      this._promise.cancel()
    }
  }
  , watch: {
    'spdConfigOriginal': 'setSliderThetas'
    , 'panelSettings': 'checkRecalculate'
    , 'panelSettings.xaxis.min': 'checkRecalculate'
    , 'panelSettings.xaxis.max': 'checkRecalculate'
    , 'panelSettings.xaxis.steps': 'checkRecalculate'
    , 'panelSettings.jsiResolution': 'checkRecalculate'
    , 'signalThetaSliderVal': 'onSignalThetaChange'
    , 'idlerThetaSliderVal': 'onIdlerThetaChange'
    , maxCount(){
      let line = this.plotlyConfigCountsChart.layout.shapes[0]
      line.y1 = this.maxCount
    }
  }
  , methods: {
    redraw(){
      if ( !this.panelSettings.autoUpdate ){ return }
      this.calculate()
    }
    , getXAxisData(){
      const xaxis = this.panelSettings.xaxis
      return this.getStepArray(this.xmin, xaxis.max, xaxis.steps)
    }
    , setSliderThetas(){
      this.signalSeries.theta = this.spdConfigOriginal.signal_theta
      this.spdWorkers.execSingle(
        'getOptimumIdler'
        , this.spdConfigOriginal
      ).then(({ result }) => {
        this.idlerSeries.theta = result.theta_e
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating optimum idler' })
      })
    }
    , onSignalThetaChange: _debounce(function(){
      this.calcHeraldingForSignalTheta()
    }, 100)
    , onIdlerThetaChange: _debounce(function(){
      this.calcHeraldingForIdlerTheta()
    }, 100)
    , calculate(){
      this.loading = true
      this._promise = Promise.all([
        this.calculateSignalSeries()
        , this.calcHeraldingForSignalTheta()
        , this.calculateIdlerSeries()
        , this.calcHeraldingForIdlerTheta()
      ]).then(durations => {
        let duration = _max(durations)
        this.status = `done in ${duration.toFixed(2)}ms`
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating Heralding vs theta plots' })
      }).finally(() => {
        this._promise = null
        this.loading = false
      })
    }
    , calcHeraldingForSignalTheta(){
      return this.spdWorkers.execSingle(
        'getHeraldingResults'
        , this.spdConfigVaryingSignal
        , this.integrationConfig
      ).then(({ result }) => {
        this.signalSeries.heraldingResults = result
      })
    }
    , calcHeraldingForIdlerTheta(){
      // need to do this so that idler angle is overriden after optimum idler applied
      return this.spdWorkers.execSingle(
        'getHeraldingResultsVsIdlerTheta'
        , this.spdConfigOriginal
        , this.integrationConfig
        , [this.idlerSeries.theta, this.idlerSeries.theta, 1]
      ).then(({ result }) => {
        this.idlerSeries.heraldingResults = result[0]
      })
    }
    , calculateSignalSeries(){
      const xaxis = this.panelSettings.xaxis
      this.signalSeries.data = null
      let partitions = this.spdWorkers.partitionSteps([this.xmin, xaxis.max], xaxis.steps | 0)
      let args = partitions.map(({ range, count }) => {
        range.push(count)
        return [
          this.spdConfigOriginal
          , this.integrationConfig
          , range
        ]
      })
      return this.spdWorkers.execAndConcat(
        'getHeraldingResultsVsSignalTheta'
        , args
      ).then( ({ result, duration }) => {
        this.signalSeries.data = result
        this.xAxisData = this.getXAxisData()
        let range = [this.xmin, xaxis.max]
        this.signalSeries.plotlyConfigEfficiencyChart.layout.xaxis.range = range
        this.signalSeries.plotlyConfigCountsChart.layout.xaxis.range = range
        this.signalThetaSliderVal = this.signalThetaSliderVal
        return duration
      })
    }
    , calculateIdlerSeries(){
      const xaxis = this.panelSettings.xaxis
      this.idlerSeries.data = null
      let partitions = this.spdWorkers.partitionSteps([this.xmin, xaxis.max], xaxis.steps | 0)
      let args = partitions.map(({ range, count }) => {
        range.push(count)
        return [
          this.spdConfigOriginal
          , this.integrationConfig
          , range
        ]
      })
      return this.spdWorkers.execAndConcat(
        'getHeraldingResultsVsIdlerTheta'
        , args
      ).then( ({ result, duration }) => {
        this.idlerSeries.data = result
        this.xAxisData = this.getXAxisData()
        let range = [this.xmin, xaxis.max]
        this.idlerSeries.plotlyConfigEfficiencyChart.layout.xaxis.range = range
        this.idlerSeries.plotlyConfigCountsChart.layout.xaxis.range = range
        this.idlerThetaSliderVal = this.idlerThetaSliderVal
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
    , onEfficiencySignalSeriesRestyle(e){
      let [changed, traces] = e
      if (changed && changed.visible && traces){
        traces.forEach(i => {
          this.signalSeries.countsChartDataVisibility.splice(i, 1, changed.visible[i])
        })
      }
    }
    , onEfficiencyIdlerSeriesRestyle(e){
      let [changed, traces] = e
      if (changed && changed.visible && traces){
        traces.forEach(i => {
          this.idlerSeries.countsChartDataVisibility.splice(i, 1, changed.visible[i])
        })
      }
    }
    , getEfficiencyChartData(scope){
      if (!scope.data){ return [] }
      return [{
        x: this.xAxisData
        , y: scope.data.map(r => r.signal_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Signal'
        , spline: {
          color: spdColors.signalColor
        }
        , marker: {
          color: spdColors.signalColor
          , size: 7
          , symbol: 'square'
        }
      }, {
        x: this.xAxisData
        , y: scope.data.map(r => r.idler_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Idler'
        , spline: {
          color: spdColors.idlerColor
        }
        , marker: {
          color: spdColors.idlerColor
          , size: 5
          , opacity: 0.6
        }
      }, {
        x: this.xAxisData
        , y: scope.data.map(r => r.symmetric_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Symmetric eff'
        , yaxis: 'y'
        , spline: {
          color: spdColors.coincColor
        }
        , marker: {
          color: spdColors.coincColor
        }
      }]
    }
    , getCountsChartData(scope){
      if (!scope.data){ return [] }
      return [{
        x: this.xAxisData
        , y: scope.data.map(r => r.signal_singles_rate)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Signal'
        , spline: {
          color: spdColors.signalColor
        }
        , visible: scope.countsChartDataVisibility[0] || true
        , marker: {
          color: spdColors.signalColor
          , size: 7
          , symbol: 'square'
        }
      }, {
        x: this.xAxisData
        , y: scope.data.map(r => r.idler_singles_rate)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Idler'
        , visible: scope.countsChartDataVisibility[1] || true
        , spline: {
          color: spdColors.idlerColor
        }
        , marker: {
          color: spdColors.idlerColor
          , size: 5
          , opacity: 0.6
        }
      }, {
        x: this.xAxisData
        , y: scope.data.map(r => r.coincidences_rate)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Coincidences'
        , visible: scope.countsChartDataVisibility[2] || true
        , yaxis: 'y'
        , spline: {
          color: spdColors.coincColor
        }
        , marker: {
          color: spdColors.coincColor
        }
      }]
    }
  }
}
</script>

<style lang="sass" scoped>
.theta-slider
  margin-right: 60px
  margin-left: 62px
.heralding-result-text
  padding: 1em 1em 0 1em
  text-align: center
  abbr
    font-size: 1.2em
</style>
