<template lang="pug">
SPDPanel(
  title="Heralding vs Waist Size"
  , @refresh="calculate"
  , @cancel="cancel"
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
        , :warningMsg="xmin < minValidWaistSize ? waistSizeWarning : undefined"
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
        , :min="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="Resolution"
        , v-model="panelSettings.jsiResolution"
        , step="1"
        , :min="1"
        , :sigfigs="0"
        , tooltip="The grid size of the JSA integration"
        , lazy
      )
  v-row(no-gutters)
    v-col(:md="12", :lg="6")
      SPDLinePlot(
        ref="effPlot"
        , :plotly-config="plotlyConfigEfficiencyChart"
        , :chart-data="efficiencyChartData"
        , xTitle="Waist Size (µm)"
        , yTitle="Efficiency"
        , :aspect-ratio="2/1"
        , @updatedView="plotView = $event"
        , @change:legendVisibility="countsLegendVisibility = $event"
      )
        template(#chart-bar)
          IconButton(
            v-if="plotView"
            , icon="mdi-target-variant"
            , tooltip="compute data over current plot view"
            , @click="applyRange"
          )
      SPDLinePlot(
        :plotly-config="plotlyConfigCountsChart"
        , :chart-data="countsChartData"
        , xTitle="Waist Size (µm)"
        , yTitle="Counts / s"
        , :aspect-ratio="2/1"
        , :show-sub-bar="false"
        , @updatedView="plotView = $event"
      )
      v-slider.waist-slider(
        v-model="waistSliderVal"
        , :min="xmin"
        , :max="panelSettings.xaxis.max"
        , :step="0.01"
      )
      .heralding-result-text(v-if="waistEfficiencyData")
        EfficiencyCountsDisplay(
          :value="waistEfficiencyData"
        )
    v-col(:md="12", :lg="6")
      SPDMultiHistogram(
        :chart-data="combinedJSIs"
        , :axes="axes"
        , :usegl="true"
        , :log-scale="panelSettings.combinedJSILogScale"
        , x-title="Signal wavelength (nm)"
        , y-title="Idler wavelength (nm)"
      )
        template(#chart-bar)
          v-spacer
          IconButton(
            icon="mdi-math-log"
            , @click="panelSettings.combinedJSILogScale = !panelSettings.combinedJSILogScale"
            , tooltip="toggle log scale"
            , :color="panelSettings.combinedJSILogScale ? 'yellow' : ''"
          )
</template>

<script>
import { mapGetters } from 'vuex'
import Promise from 'bluebird'
import panelMixin from '@/components/panel.mixin'
import SPDLinePlot from '@/components/spd-line-plot.vue'
import SPDHistogram from '@/components/spd-histogram.vue'
import SPDMultiHistogram from '@/components/spd-multi-histogram.vue'
import EfficiencyCountsDisplay from '@/components/efficiency-counts-display.vue'
import { createGroupedArray } from '@/lib/data-utils'
import { waistSizeWarning } from '@/text'
import _debounce from 'lodash/debounce'
import _max from 'lodash/max'
import spdColors from '@/spd-colors'
import chroma from 'chroma-js'
import { interruptDebounce } from '../../lib/batch-worker'

const maxHistogramOpacity = 1

// const ZERO_HERALDING_RESULTS = {
//   signal_singles_rate: 0
//   , idler_singles_rate: 0
//   , coincidences_rate: 0
//   , signal_efficiency: 0
//   , idler_efficiency: 0
//   , symmetric_efficiency: 0
// }

export default {
  name: 'heralding-v-waist-series',
  mixins: [panelMixin],
  props: {},
  data: () => ({
    waistSizeWarning,
    panelSettings: {
      combinedJSILogScale: false,
      xaxis: {
        min: 'auto',
        max: 130,
        steps: 10,
      },
      jsiResolution: 30,
    },
    plotView: null,
    data: null,
    axes: {},
    waistSize: 60,
    waistEfficiencyData: null,
    coincidencesNormalized: [],
    singlesSignalNormalized: [],
    singlesIdlerNormalized: [],
    combinedJSIs: [],
    xAxisData: [],
    plotlyConfigEfficiencyChart: {
      watchShallow: true,
      layout: {
        margin: {
          b: 24,
        },
        xaxis: {
          title: {
            font: {
              family: 'a',
            },
          },
        },
        yaxis: {
          rangemode: 'tozero',
        },
        shapes: [
          {
            type: 'line',
            x0: 60,
            x1: 60,
            yref: 'paper',
            y0: 0,
            y1: 1,
            line: {
              color: spdColors.indicatorLine,
              width: 3,
              dash: 'dot',
            },
          },
        ],
      },
    },
    countsLegendVisibility: [],
    plotlyConfigCountsChart: {
      options: {
        displayModeBar: false,
      },
      layout: {
        showlegend: false,
        margin: {
          t: 10,
        },
        xaxis: {},
        yaxis: {
          rangemode: 'tozero',
        },
        shapes: [
          {
            type: 'line',
            x0: 60,
            x1: 60,
            yref: 'paper',
            y0: 0,
            y1: 1,
            line: {
              color: spdColors.indicatorLine,
              width: 3,
              dash: 'dot',
            },
          },
        ],
      },
    },
  }),
  components: {
    SPDLinePlot,
    SPDHistogram,
    SPDMultiHistogram,
    EfficiencyCountsDisplay,
  },
  computed: {
    xmin: {
      get() {
        return this.panelSettings.xaxis.min === 'auto'
          ? +this.minValidWaistSize.toFixed(2)
          : this.panelSettings.xaxis.min
      },
      set(v) {
        this.panelSettings.xaxis.min = +v
      },
    },
    minValidWaistSize() {
      return Math.max(this.minSignalWaistSize, this.minIdlerWaistSize)
    },
    waistSliderVal: {
      get() {
        return this.waistSize
      },
      set(v) {
        this.waistSize = +v
        let line = this.plotlyConfigEfficiencyChart.layout.shapes[0]
        line.x0 = v
        line.x1 = v
        line = this.plotlyConfigCountsChart.layout.shapes[0]
        line.x0 = v
        line.x1 = v
      },
    },
    efficiencyChartData() {
      if (!this.data) {
        return []
      }
      return [
        {
          x: this.xAxisData,
          y: this.data.map((r) => r.signal),
          type: 'scatter',
          mode: 'lines+markers',
          line: { shape: 'spline' },
          name: 'Signal',
          spline: {
            color: spdColors.signalColor,
          },
          marker: {
            color: spdColors.signalColor,
            size: 7,
            symbol: 'square',
          },
        },
        {
          x: this.xAxisData,
          y: this.data.map((r) => r.idler),
          type: 'scatter',
          mode: 'lines+markers',
          line: { shape: 'spline' },
          name: 'Idler',
          spline: {
            color: spdColors.idlerColor,
          },
          marker: {
            color: spdColors.idlerColor,
            size: 5,
            opacity: 0.6,
          },
        },
        {
          x: this.xAxisData,
          y: this.data.map((r) => r.symmetric),
          type: 'scatter',
          mode: 'lines+markers',
          line: { shape: 'spline' },
          name: 'Symmetric',
          yaxis: 'y',
          spline: {
            color: spdColors.coincColor,
          },
          marker: {
            color: spdColors.coincColor,
          },
        },
      ]
    },
    countsChartData() {
      if (!this.data) {
        return []
      }
      return [
        {
          x: this.xAxisData,
          y: this.data.map((r) => r.signal_singles),
          type: 'scatter',
          mode: 'lines+markers',
          line: { shape: 'spline' },
          name: 'Signal',
          spline: {
            color: spdColors.signalColor,
          },
          visible: this.countsLegendVisibility[0] || true,
          marker: {
            color: spdColors.signalColor,
            size: 7,
            symbol: 'square',
          },
        },
        {
          x: this.xAxisData,
          y: this.data.map((r) => r.idler_singles),
          type: 'scatter',
          mode: 'lines+markers',
          line: { shape: 'spline' },
          name: 'Idler',
          visible: this.countsLegendVisibility[1] || true,
          spline: {
            color: spdColors.idlerColor,
          },
          marker: {
            color: spdColors.idlerColor,
            size: 5,
            opacity: 0.6,
          },
        },
        {
          x: this.xAxisData,
          y: this.data.map((r) => r.coincidences),
          type: 'scatter',
          mode: 'lines+markers',
          line: { shape: 'spline' },
          name: 'Coincidences',
          visible: this.countsLegendVisibility[2] || true,
          yaxis: 'y',
          spline: {
            color: spdColors.coincColor,
          },
          marker: {
            color: spdColors.coincColor,
          },
        },
      ]
    },
    integrationConfig() {
      const size = this.panelSettings.jsiResolution
      return { ...this.integrationConfigOriginal, size }
    },
    spdConfig() {
      const waist = this.waistSize
      return {
        ...this.spdConfigOriginal,
        signal_waist: waist,
        idler_waist: waist,
      }
    },
    ...mapGetters('parameters', {
      spdConfigOriginal: 'spdConfig',
      integrationConfigOriginal: 'integrationConfig',
      minSignalWaistSize: 'minSignalWaistSize',
      minIdlerWaistSize: 'minIdlerWaistSize',
    }),
  },
  created() {
    this.$on('parametersUpdated', () => this.calculate())
  },
  beforeDestroy() {
    if (this._promise) {
      this._promise.cancel()
    }
  },
  watch: {
    panelSettings: 'checkRecalculate',
    'panelSettings.xaxis.min': 'checkRecalculate',
    'panelSettings.xaxis.max': 'checkRecalculate',
    'panelSettings.xaxis.steps': 'checkRecalculate',
    'panelSettings.jsiResolution': 'checkRecalculate',
    waistSize: 'onWaistSizeChange',
  },
  methods: {
    redraw() {
      if (!this.panelSettings.autoUpdate) {
        return
      }
      this.calculate()
    },
    getXAxisData() {
      const xaxis = this.panelSettings.xaxis
      return this.getStepArray(this.xmin, xaxis.max, xaxis.steps)
    },
    onWaistSizeChange: _debounce(function () {
      this.loading = true
      this.calcJSIs().finally(() => {
        this.loading = false
      })
    }, 100),
    calculate() {
      this.loading = true
      this._promise = Promise.all([this.calculateSeries(), this.calcJSIs()])
        .then((durations) => {
          let duration = _max(durations)
          this.status = `done in ${duration.toFixed(2)}ms`
        })
        .catch((error) => {
          this.$store.dispatch('error', {
            error,
            context: 'while calculating Heralding vs waist plot',
          })
        })
        .finally(() => {
          this._promise = null
          this.loading = false
        })
    },
    calcHeraldingForWaist: interruptDebounce(function () {
      return this.spdWorkers
        .execSingle(
          'getHeraldingResults',
          this.spdConfig,
          this.integrationConfig
        )
        .then(({ result }) => {
          this.waistEfficiencyData = result
        })
    }),
    calcJSIs() {
      let dim = this.integrationConfig.size
      this.coincidencesNormalized = []
      this.singlesSignalNormalized = []
      this.singlesIdlerNormalized = []
      this.combinedJSIs = []
      return Promise.all([
        this.calcJSICSI(),
        this.calcHeraldingForWaist(),
      ]).then((durations) => {
        this.combineJSIs(dim)
        let duration = _max(durations)
        this.status = `done in ${duration.toFixed(2)}ms`
        return duration
      })
    },
    calcJSICSI: interruptDebounce(function () {
      return this.spdWorkers
        .execSingle('getJSICSI', this.spdConfig, this.integrationConfig)
        .then(({ result, duration }) => {
          this.coincidences = result.coincidences
          this.singlesSignal = result.signal_singles
          this.singlesIdler = result.idler_singles
          this.axes = this.getAxes()
          return duration
        })
    }),
    combineJSIs(dim) {
      let coinc = this.coincidences
      let sig = this.singlesSignal
      let idl = this.singlesIdler

      this.coincidencesNormalized = createGroupedArray(coinc, dim)
      this.singlesSignalNormalized = createGroupedArray(sig, dim)
      this.singlesIdlerNormalized = createGroupedArray(idl, dim)
      this.combinedJSIs = [
        {
          data: this.singlesSignalNormalized,
          name: 'Singles (signal)',
          scale: chroma
            .scale([
              chroma(spdColors.signalColor).alpha(0),
              chroma(spdColors.signalColor).alpha(maxHistogramOpacity),
            ])
            .mode('lab'),
        },
        {
          data: this.singlesIdlerNormalized,
          name: 'Singles (idler)',
          scale: chroma
            .scale([
              chroma(spdColors.idlerColor).alpha(0),
              chroma(spdColors.idlerColor).alpha(maxHistogramOpacity),
            ])
            .mode('lab'),
        },
        {
          data: this.coincidencesNormalized,
          name: 'Coincidences',
          scale: chroma
            .scale([
              chroma(spdColors.coincColor).alpha(0),
              chroma(spdColors.coincColor).alpha(maxHistogramOpacity),
            ])
            .mode('lab'),
        },
      ]
    },
    getAxes() {
      let cfg = this.integrationConfig
      let x0 = cfg.ls_min
      let dx = (cfg.ls_max - x0) / (cfg.size - 1)
      let y0 = cfg.li_min
      let dy = (cfg.li_max - y0) / (cfg.size - 1)
      return {
        x0,
        dx,
        y0,
        dy,
      }
    },
    calculateSeries: interruptDebounce(function () {
      const xaxis = this.panelSettings.xaxis
      this.data = null
      let partitions = this.spdWorkers.partitionSteps(
        [this.xmin, xaxis.max],
        xaxis.steps | 0
      )
      let args = partitions.map(({ range, count }) => {
        range.push(count)
        return [this.spdConfig, this.integrationConfig, range]
      })
      return this.spdWorkers
        .execAndConcat('getHeraldingResultsVsWaist', args)
        .then(({ result, duration }) => {
          this.data = result
          this.xAxisData = this.getXAxisData()
          let range = [this.xmin, xaxis.max]
          this.plotlyConfigEfficiencyChart.layout.xaxis.range = range
          this.plotlyConfigCountsChart.layout.xaxis.range = range
          return duration
        })
    }),
    applyRange() {
      const xRange = this.plotView.xRange
      this.panelSettings.xaxis = {
        min: xRange[0],
        max: xRange[1],
        steps: this.panelSettings.xaxis.steps,
      }
    },
  },
}
</script>

<style lang="sass" scoped>
.waist-slider
  margin-top: 1em
  margin-bottom: 0em
  margin-right: 60px
  margin-left: 62px
</style>
