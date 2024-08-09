<template lang="pug">
SPDPanel(
  title="Counts vs Fiber Theta"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
  , :size="showIdlerThetaPlot ? 2 : 1"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="-Δθ"
        , v-model="xmin"
        , :min="-90"
        , :max="90"
        , lazy
        , :sigfigs="2"
        , units="°"
      )
      ParameterInput(
        label="Δθ"
        , v-model="panelSettings.xaxis.max"
        , :min="-90"
        , :max="90"
        , lazy
        , :sigfigs="2"
        , units="°"
      )
      ParameterInput(
        label="Steps"
        , v-model="panelSettings.xaxis.steps"
        , :min="1"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="Resolution"
        , v-model="panelSettings.jsiResolution"
        , :min="1"
        , step="1"
        , :sigfigs="0"
        , tooltip="The grid size of the JSA integration"
        , lazy
      )
  v-row(no-gutters)
    v-col(:md="12", :lg="showIdlerThetaPlot ? 6 : 12")
      SPDLinePlot(
        :plotly-config="signalSeries.plotlyConfigCountsChart"
        , :chart-data="countsChartSignalSeriesData"
        , xTitle="Signal Theta (degrees)"
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
      //- )

      .heralding-result-text(v-if="signalSeries.efficiencyData").
        <abbr title="coincidence count rate">R<sub>c</sub></abbr>: {{ signalSeries.efficiencyData.coincidences.toFixed(4) }} |
        <abbr title="signal singles count rate">R<sub>ss</sub></abbr>: {{ signalSeries.efficiencyData.signal_singles.toFixed(4) }}
        <abbr title="idler singles count rate">R<sub>si</sub></abbr>: {{ signalSeries.efficiencyData.idler_singles.toFixed(4) }}
        <br/>
        <abbr title="signal efficiency">&eta;<sub>s</sub></abbr>: {{ signalSeries.efficiencyData.signal.toFixed(4) }} |
        <abbr title="idler efficiency">&eta;<sub>i</sub></abbr>: {{ signalSeries.efficiencyData.idler.toFixed(4) }}
      v-slider.theta-slider(
        v-model="signalThetaSliderVal"
        , :min="xmin"
        , :max="panelSettings.xaxis.max"
        , :step="0.01"
      )
    v-col(v-if="showIdlerThetaPlot", :md="12", :lg="6")
      SPDLinePlot(
        :plotly-config="idlerSeries.plotlyConfigCountsChart"
        , :chart-data="countsChartIdlerSeriesData"
        , xTitle="Idler Theta (degrees)"
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
      //- )

      .heralding-result-text(v-if="idlerSeries.efficiencyData").
        <abbr title="coincidence count rate">R<sub>c</sub></abbr>: {{ idlerSeries.efficiencyData.coincidences.toFixed(4) }} |
        <abbr title="signal singles count rate">R<sub>ss</sub></abbr>: {{ idlerSeries.efficiencyData.signal_singles.toFixed(4) }}
        <abbr title="idler singles count rate">R<sub>si</sub></abbr>: {{ idlerSeries.efficiencyData.idler_singles.toFixed(4) }}
        <br/>
        <abbr title="signal efficiency">&eta;<sub>s</sub></abbr>: {{ idlerSeries.efficiencyData.signal.toFixed(4) }} |
        <abbr title="idler efficiency">&eta;<sub>i</sub></abbr>: {{ idlerSeries.efficiencyData.idler.toFixed(4) }}

      v-slider.theta-slider(
        v-model="idlerThetaSliderVal"
        , :min="xmin"
        , :max="panelSettings.xaxis.max"
        , :step="0.01"
      )
</template>

<script>
import { mapGetters } from "vuex";
import Promise from "bluebird";
import panelMixin from "@/components/panel.mixin";
import SPDLinePlot from "@/components/spd-line-plot.vue";
import _debounce from "lodash/debounce";
import _max from "lodash/max";
import _cloneDeep from "lodash/cloneDeep";
import spdColors from "@/spd-colors";
import { interruptDebounce } from "../../lib/batch-worker";

// const ZERO_HERALDING_RESULTS = {
//   signal_singles_rate: 0
//   , idler_singles_rate: 0
//   , coincidences_rate: 0
//   , signal_efficiency: 0
//   , idler_efficiency: 0
//   , symmetric_efficiency: 0
// }

const plotlyConfigEfficiencyChart = {
  watchShallow: true,
  layout: {
    margin: {
      b: 24,
    },
    xaxis: {
      title: false,
    },
    yaxis: {
      rangemode: "tozero",
    },
    shapes: [
      {
        type: "line",
        x0: 60,
        x1: 60,
        yref: "paper",
        y0: 0,
        y1: 1,
        line: {
          color: spdColors.indicatorLine,
          width: 3,
          dash: "dot",
        },
      },
    ],
  },
};

const plotlyConfigCountsChart = {
  options: {
    // displayModeBar: false
  },
  layout: {
    margin: {
      t: 10,
    },
    // , showlegend: false
    xaxis: {},
    yaxis: {
      rangemode: "tozero",
    },
    shapes: [
      {
        type: "line",
        x0: 60,
        x1: 60,
        yref: "paper",
        y0: 0,
        y1: 1,
        line: {
          color: spdColors.indicatorLine,
          width: 3,
          dash: "dot",
        },
      },
    ],
  },
};

export default {
  name: "heralding-v-angle-series",
  mixins: [panelMixin],
  props: {},
  data: () => ({
    showIdlerThetaPlot: false,
    panelSettings: {
      xaxis: {
        min: -2,
        max: 2,
        steps: 11,
      },
      jsiResolution: 30,
    },
    plotView: null,
    axes: {},
    xAxisData: [],
    signalSeries: {
      plotlyConfigEfficiencyChart: _cloneDeep(plotlyConfigEfficiencyChart),
      plotlyConfigCountsChart: _cloneDeep(plotlyConfigCountsChart),
      data: null,
      theta: 0,
      efficiencyData: null,
    },
    idlerSeries: {
      plotlyConfigEfficiencyChart: _cloneDeep(plotlyConfigEfficiencyChart),
      plotlyConfigCountsChart: _cloneDeep(plotlyConfigCountsChart),
      data: null,
      theta: 0,
      efficiencyData: null,
    },
  }),
  components: {
    SPDLinePlot,
  },
  computed: {
    xmin: {
      get() {
        return this.panelSettings.xaxis.min;
      },
      set(v) {
        this.panelSettings.xaxis.min = +v;
      },
    },
    signalThetaSliderVal: {
      get() {
        return this.signalSeries.theta;
      },
      set(v) {
        this.signalSeries.theta = +v;
        let line =
          this.signalSeries.plotlyConfigEfficiencyChart.layout.shapes[0];
        line.x0 = v;
        line.x1 = v;
        line = this.signalSeries.plotlyConfigCountsChart.layout.shapes[0];
        line.x0 = v;
        line.x1 = v;
      },
    },
    idlerThetaSliderVal: {
      get() {
        return this.idlerSeries.theta;
      },
      set(v) {
        this.idlerSeries.theta = +v;
        let line =
          this.idlerSeries.plotlyConfigEfficiencyChart.layout.shapes[0];
        line.x0 = v;
        line.x1 = v;
        line = this.idlerSeries.plotlyConfigCountsChart.layout.shapes[0];
        line.x0 = v;
        line.x1 = v;
      },
    },
    efficiencyChartSignalSeriesData() {
      return this.getEfficiencyChartData(this.signalSeries);
    },
    countsChartSignalSeriesData() {
      return this.getCountsChartData(this.signalSeries);
    },
    efficiencyChartIdlerSeriesData() {
      return this.getEfficiencyChartData(this.idlerSeries);
    },
    countsChartIdlerSeriesData() {
      return this.getCountsChartData(this.idlerSeries);
    },
    integrationConfig() {
      const size = this.panelSettings.jsiResolution;
      return { ...this.integrationConfigOriginal, size };
    },
    ...mapGetters("parameters", {
      spdConfigOriginal: "spdConfig",
      integrationConfigOriginal: "integrationConfig",
    }),
  },
  created() {
    this.$on("parametersUpdated", () => this.calculate());
  },
  watch: {
    panelSettings: "checkRecalculate",
    "panelSettings.xaxis.min": "checkRecalculate",
    "panelSettings.xaxis.max": "checkRecalculate",
    "panelSettings.xaxis.steps": "checkRecalculate",
    "panelSettings.jsiResolution": "checkRecalculate",
    signalThetaSliderVal: "onSignalThetaChange",
    idlerThetaSliderVal: "onIdlerThetaChange",
  },
  methods: {
    redraw() {
      if (!this.panelSettings.autoUpdate) {
        return;
      }
      this.calculate();
    },
    getXAxisData() {
      const xaxis = this.panelSettings.xaxis;
      let min = xaxis.min + this.spdConfigOriginal.signal_theta;
      let max = xaxis.max + this.spdConfigOriginal.signal_theta;
      return this.getStepArray(min, max, xaxis.steps);
    },
    onSignalThetaChange: _debounce(function () {
      this.calcHeraldingForSignalTheta();
    }, 100),
    onIdlerThetaChange: _debounce(function () {
      this.calcHeraldingForIdlerTheta();
    }, 100),
    calculate() {
      this.loading = true;
      Promise.all([
        this.calculateSignalSeries(),
        this.calcHeraldingForSignalTheta(),
        this.calculateIdlerSeries(),
        this.calcHeraldingForIdlerTheta(),
      ])
        .then((durations) => {
          let duration = _max(durations);
          this.status = `done in ${duration.toFixed(2)}ms`;
        })
        .catch((error) => {
          this.$store.dispatch("error", {
            error,
            context: "while calculating Heralding vs theta plots",
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },
    calcHeraldingForSignalTheta: interruptDebounce(function () {
      return this.spdWorkers
        .execSingle(
          "getHeraldingResultsVsSignalTheta",
          this.spdConfigOriginal,
          this.integrationConfig,
          [this.signalSeries.theta, this.signalSeries.theta, 1]
        )
        .then(({ result }) => {
          this.signalSeries.efficiencyData = result[0];
        });
    }),
    calcHeraldingForIdlerTheta: interruptDebounce(function () {
      if (!this.showIdlerThetaPlot) {
        return;
      }
      // need to do this so that idler angle is overriden after optimum idler applied
      return this.spdWorkers
        .execSingle(
          "getHeraldingResultsVsIdlerTheta",
          this.spdConfigOriginal,
          this.integrationConfig,
          [this.idlerSeries.theta, this.idlerSeries.theta, 1]
        )
        .then(({ result }) => {
          this.idlerSeries.efficiencyData = result[0];
        });
    }),
    calculateSignalSeries: interruptDebounce(function () {
      const xaxis = this.panelSettings.xaxis;
      this.signalSeries.data = null;
      let range = [
        this.spdConfigOriginal.signal_theta + this.xmin,
        this.spdConfigOriginal.signal_theta + xaxis.max,
      ];
      let partitions = this.spdWorkers.partitionSteps(range, xaxis.steps | 0);
      let args = partitions.map(({ range, count }) => {
        range.push(count);
        return [this.spdConfigOriginal, this.integrationConfig, range];
      });
      return this.spdWorkers
        .execAndConcat("getHeraldingResultsVsSignalTheta", args)
        .then(({ result, duration }) => {
          this.signalSeries.data = result;
          this.xAxisData = this.getXAxisData();
          this.signalSeries.plotlyConfigEfficiencyChart.layout.xaxis.range =
            range;
          this.signalSeries.plotlyConfigCountsChart.layout.xaxis.range = range;
          this.signalThetaSliderVal = +this.signalThetaSliderVal;
          return duration;
        });
    }),
    calculateIdlerSeries: interruptDebounce(function () {
      if (!this.showIdlerThetaPlot) {
        return;
      }
      const xaxis = this.panelSettings.xaxis;
      this.idlerSeries.data = null;
      let range = [
        this.spdConfigOriginal.signal_theta + this.xmin,
        this.spdConfigOriginal.signal_theta + xaxis.max,
      ];
      let partitions = this.spdWorkers.partitionSteps(range, xaxis.steps | 0);
      let args = partitions.map(({ range, count }) => {
        range.push(count);
        return [this.spdConfigOriginal, this.integrationConfig, range];
      });
      return this.spdWorkers
        .execAndConcat("getHeraldingResultsVsIdlerTheta", args)
        .then(({ result, duration }) => {
          this.idlerSeries.data = result;
          this.xAxisData = this.getXAxisData();
          this.idlerSeries.plotlyConfigEfficiencyChart.layout.xaxis.range =
            range;
          this.idlerSeries.plotlyConfigCountsChart.layout.xaxis.range = range;
          // eslint-disable-next-line no-self-assign
          this.idlerThetaSliderVal = this.idlerThetaSliderVal;
          return duration;
        });
    }),
    applyRange() {
      const xRange = this.plotView.xRange;
      this.panelSettings.xaxis = {
        min: xRange[0],
        max: xRange[1],
        steps: this.panelSettings.xaxis.steps,
      };
    },
    getEfficiencyChartData(scope) {
      if (!scope.data) {
        return [];
      }
      return [
        {
          x: this.xAxisData,
          y: scope.data.map((r) => r.signal),
          type: "scatter",
          mode: "lines+markers",
          line: { shape: "spline" },
          name: "Signal",
          spline: {
            color: spdColors.signalColor,
          },
          marker: {
            color: spdColors.signalColor,
            size: 7,
            symbol: "square",
          },
        },
        {
          x: this.xAxisData,
          y: scope.data.map((r) => r.idler),
          type: "scatter",
          mode: "lines+markers",
          line: { shape: "spline" },
          name: "Idler",
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
          y: scope.data.map((r) => r.symmetric),
          type: "scatter",
          mode: "lines+markers",
          line: { shape: "spline" },
          name: "Symmetric eff",
          yaxis: "y",
          spline: {
            color: spdColors.coincColor,
          },
          marker: {
            color: spdColors.coincColor,
          },
        },
      ];
    },
    getCountsChartData(scope) {
      if (!scope.data) {
        return [];
      }
      return [
        {
          x: this.xAxisData,
          y: scope.data.map((r) => r.signal_singles),
          type: "scatter",
          mode: "lines+markers",
          line: { shape: "spline" },
          name: "Signal",
          spline: {
            color: spdColors.signalColor,
          },
          marker: {
            color: spdColors.signalColor,
            size: 7,
            symbol: "square",
          },
        },
        {
          x: this.xAxisData,
          y: scope.data.map((r) => r.idler_singles),
          type: "scatter",
          mode: "lines+markers",
          line: { shape: "spline" },
          name: "Idler",
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
          y: scope.data.map((r) => r.coincidences),
          type: "scatter",
          mode: "lines+markers",
          line: { shape: "spline" },
          name: "Coincidences",
          yaxis: "y",
          spline: {
            color: spdColors.coincColor,
          },
          marker: {
            color: spdColors.coincColor,
          },
        },
      ];
    },
  },
};
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
