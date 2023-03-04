<template lang="pug">
SPDPanel(
  title="Two Source Hong-Ou-Mandel Time Series"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="2"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="Δt min"
        , v-model="panelSettings.xaxis.min"
        , tooltip="The minimum time delay to plot"
        , :sigfigs="2"
        , units="fs"
        , lazy
      )
      ParameterInput(
        label="Δt max"
        , v-model="panelSettings.xaxis.max"
        , tooltip="The maximum time delay to plot"
        , :sigfigs="2"
        , units="fs"
        , lazy
      )
      ParameterInput(
        label="Steps"
        , v-model="panelSettings.xaxis.steps"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="JSI Resolution"
        , v-model="panelSettings.jsiResolution"
        , step="2"
        , :sigfigs="0"
        , lazy
      )
  SPDLinePlot(
    :chart-data="homData"
    , :plotly-config="plotlyConfig"
    , x-title="Time Delay (fs)"
    , y-title="Coincidence Rate"
    , @updatedView="plotView = $event"
    , @change:legendVisibility="homLegendVisibility = $event"
  )
    template(#chart-bar)
      IconButton(
        v-if="plotView"
        , icon="mdi-target-variant"
        , tooltip="compute data over current plot view"
        , @click="applyRange"
      )
  template(#result-bar)
    span.result Visibility (ss, ii, si): {{visibilities}}
</template>

<script>
import panelMixin from '@/components/panel.mixin'
import { mapGetters } from 'vuex'
import SPDLinePlot from '@/components/spd-line-plot.vue'
import _debounce from 'lodash/debounce'
import _mapValues from 'lodash/mapValues'
import _min from 'lodash/min'
import spdColors from '@/spd-colors'
import { concatResults } from '@/lib/batch-worker'
import { interruptDebounce } from '../../lib/batch-worker'

const visibility = data => (0.5 - _min(data)) / 0.5

export default {
  name: 'hom-two-source-series'
  , mixins: [panelMixin]
  , data: () => ({
    panelSettings: {
      xaxis: {
        min: -2000
        , max: 2000
        , steps: 51
      }
      , jsiResolution: 20
    }
    , data: null
    , homLegendVisibility: []
    , xAxisData: []
    , resizeCount: 0
    , plotView: null
    , plotlyConfig: {
      layout: {
        yaxis: {
          rangemode: 'tozero'
        }
        , xaxis: {
          rangemode: 'normal'
        }
      }
    }
    , visibility: null
  })
  , components: {
    SPDLinePlot
  }
  , computed: {
    ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ]),
    homData(){
      if (!this.data) { return [] }
      return [{
        x: this.xAxisData
        , y: this.data.ss
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Signal-Signal'
        , spline: {
          color: spdColors.signalColor
        }
        , visible: this.homLegendVisibility[0] || true
        , marker: {
          color: spdColors.signalColor
          , size: 7
          , symbol: 'square'
        }
      }, {
        x: this.xAxisData
        , y: this.data.ii
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Idler-Idler'
        , spline: {
          color: spdColors.idlerColor
        }
        , visible: this.homLegendVisibility[1] || true
        , marker: {
          color: spdColors.idlerColor
          , size: 5
          , opacity: 0.6
        }
      }, {
        x: this.xAxisData
        , y: this.data.si
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Signal-Idler'
        , spline: {
          color: spdColors.coincColor
        }
        , visible: this.homLegendVisibility[2] || false
        , marker: {
          color: spdColors.coincColor
        }
      }]
    },
    visibilities() {
      if (!this.visibility) {
        return ''
      }

      const [, ss, ii, si] = this.visibility
      return `${ss.toFixed(4)}, ${ii.toFixed(4)}, ${si.toFixed(4)}`
    }
  }
  , created(){
    this.$on('parametersUpdated', () => this.calculate())
  }
  , watch: {
    'panelSettings': {
      handler: 'redraw'
      , deep: true
    }
  }
  , methods: {
    redraw(){
      if ( !this.panelSettings.autoUpdate ){ return }
      this.calculate()
    }
    , getXAxisData(){
      const xaxis = this.panelSettings.xaxis
      return this.getStepArray(xaxis.min, xaxis.max, xaxis.steps)
    }
    , calcVisibility: interruptDebounce(function () {
      let ic = { ...this.integrationConfig, size: this.panelSettings.jsiResolution }
      return this.spdWorkers.execSingle(
        'getHOMTwoSourceVisibility'
        , this.spdConfig
        , ic
      )
    })
    , calcSeries: interruptDebounce(function () {
      let xaxis = _mapValues(this.panelSettings.xaxis, v => +v)
      let ic = { ...this.integrationConfig, size: this.panelSettings.jsiResolution }
      const ranges = this.spdWorkers.partitionSteps([xaxis.min, xaxis.max], xaxis.steps)
      const args = ranges.map(({ range, count }) => {
        const [min, max] = range
        return [
          this.spdConfig
          , ic
          , { min, max, steps: count }
        ]
      })
      return this.spdWorkers.exec(
        'getHOMTwoSourceSeries'
        , args
      )
    })
    , calculate: _debounce(async function(){
      this.loading = true
      this.data = null

      try {
        const { result, duration } = await this.calcSeries()
        this.data = {
          ss: concatResults(result.map(r => r.ss)),
          ii: concatResults(result.map(r => r.ii)),
          si: concatResults(result.map(r => r.si))
        }
        this.xAxisData = this.getXAxisData()

        const { result: visibilities, duration: duration2 } = await this.calcVisibility()

        this.visibility = visibilities
        const totalDuration = duration + duration2
        this.status = `done in ${totalDuration.toFixed(2)}ms`
      } catch ( error ) {
        this.$store.dispatch('error', { error, context: 'while calculating two source HOM' })
      } finally {
        setTimeout(() => {
          this.loading = false
        }, 100)
      }
    }, 500)
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

<style lang="sass">
</style>
