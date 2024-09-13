<template lang="pug">
SPDPanel(
  title="Phasematching Curves"
  , @refresh="calculate"
  , @cancel="cancel"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterSelector(
        v-model="panelSettings.xProp"
        , :items="props"
      ).full-width
      ParameterInput(
        v-model="xRange.min"
        , lazy
        , :min="xprop.range[0]"
        , :max="xprop.range[1]"
        , :units="xprop.units"
        , :sigfigs="2"
      )
      .dash &mdash;
      ParameterInput(
        v-model="xRange.max"
        , lazy
        , :min="xprop.range[0]"
        , :max="xprop.range[1]"
        , :units="xprop.units"
        , :sigfigs="2"
      )
      ParameterInput(
        label="steps"
        , v-model="xRange.steps"
        , lazy
        , :step="1"
      )
    .props-toolbar
      ParameterSelector(
        v-model="panelSettings.yProp"
        , :items="props"
      ).full-width
      ParameterInput(
        v-model="yRange.min"
        , lazy
        , :min="yprop.range[0]"
        , :max="yprop.range[1]"
        , :units="yprop.units"
        , :sigfigs="2"
      )
      .dash &mdash;
      ParameterInput(
        v-model="yRange.max"
        , lazy
        , :min="yprop.range[0]"
        , :max="yprop.range[1]"
        , :units="yprop.units"
        , :sigfigs="2"
      )
      ParameterInput(
        label="steps"
        , v-model="yRange.steps"
        , lazy
        , :step="1"
      )

  SPDHistogram(
    :chart-data="intensities"
    , :axes="axes"
    , :zrange="[0, 1]"
    , :log-scale="panelSettings.enableLogScale"
    , :highlight-zero="panelSettings.highlightZero"
    , :x-title="xTitle"
    , :y-title="yTitle"
    , @updatedView="plotView = $event"
  )
    template(#chart-bar)
      IconButton(
        v-if="plotView"
        , icon="mdi-target-variant"
        , tooltip="compute data over current plot view"
        , @click="applyRange"
      )
      v-spacer
      IconButton(icon="mdi-math-log", @click="panelSettings.enableLogScale = !panelSettings.enableLogScale", tooltip="toggle log scale", :color="panelSettings.enableLogScale ? 'yellow' : ''")
      IconButton(icon="mdi-eye", @click="panelSettings.highlightZero = !panelSettings.highlightZero", tooltip="toggle zero highlighting", :color="panelSettings.highlightZero ? 'yellow' : ''")
</template>

<script>
import panelMixin from '@/components/panel.mixin'
import { mapGetters, mapMutations } from 'vuex'
import SPDHistogram from '@/components/spd-histogram.vue'
import { createGroupedArray } from '@/lib/data-utils'
import { interruptDebounce } from '../../lib/batch-worker'

const PROPS = [
  {
    label: 'Signal Theta',
    prop: 'signal.theta_external_deg',
    units: '°',
    range: [-10, 10],
    defaults: {
      min: 0,
      max: 3,
      steps: 100,
    },
  },
  {
    label: 'Idler Theta',
    prop: 'idler.theta_external_deg',
    units: '°',
    range: [-10, 10],
    defaults: {
      min: 0,
      max: 3,
      steps: 100,
    },
  },
  {
    label: 'Signal Wavelength',
    prop: 'signal.wavelength_nm',
    units: 'nm',
    range: [0, 10000],
    defaults: {
      min: 1500,
      max: 1600,
      steps: 100,
    },
  },
  {
    label: 'Idler Wavelength',
    prop: 'idler.wavelength_nm',
    units: 'nm',
    range: [0, 10000],
    defaults: {
      min: 1500,
      max: 1600,
      steps: 100,
    },
  },
  {
    label: 'Pump Wavelength',
    prop: 'pump.wavelength_nm',
    units: 'nm',
    range: [0, 10000],
    defaults: {
      min: 600,
      max: 800,
      steps: 100,
    },
  },
  // {
  //   label: 'Signal Waist',
  //   prop: 'signal.waist_um',
  //   units: 'µm',
  //   range: [1, 1000],
  //   defaults: {
  //     min: 10,
  //     max: 100,
  //     steps: 100,
  //   },
  // },
  // {
  //   label: 'Idler Waist',
  //   prop: 'idler.waist_um',
  //   units: 'µm',
  //   range: [1, 1000],
  //   defaults: {
  //     min: 10,
  //     max: 100,
  //     steps: 100,
  //   },
  // },
  // {
  //   label: 'Signal Waist Position',
  //   prop: 'signal.waist_position_um',
  //   units: 'µm',
  //   range: [-100000, 100000],
  //   defaults: {
  //     min: -2000,
  //     max: 0,
  //     steps: 100,
  //   },
  // },
  // {
  //   label: 'Idler Waist Position',
  //   prop: 'idler.waist_position_um',
  //   units: 'µm',
  //   range: [-100000, 100000],
  //   defaults: {
  //     min: -2000,
  //     max: 0,
  //     steps: 100,
  //   },
  // },
  {
    label: 'Crystal Length',
    prop: 'crystal.length_um',
    units: 'µm',
    range: [1, 100000],
    defaults: {
      min: 1000,
      max: 3000,
      steps: 50,
    },
  },
  {
    label: 'Crystal Theta',
    prop: 'crystal.theta_deg',
    units: '°',
    range: [0, 180],
    defaults: {
      min: 80,
      max: 100,
      steps: 100,
    },
  },
  {
    label: 'Crystal Phi',
    prop: 'crystal.phi_deg',
    units: '°',
    range: [0, 360],
    defaults: {
      min: 0,
      max: 80,
      steps: 100,
    },
  },
  {
    label: 'Crystal Temperature',
    prop: 'crystal.temperature_c',
    units: '°C',
    range: [-274, 1000],
    defaults: {
      min: 20,
      max: 30,
      steps: 100,
    },
  },
  {
    label: 'Poling Period',
    prop: 'periodic_poling.poling_period_um',
    units: 'µm',
    range: [-10000, 10000],
    defaults: {
      min: 30,
      max: 50,
      steps: 100,
    },
  },
  // {
  //   label: 'Pump Average Power',
  //   prop: 'pump.average_power_mw',
  //   units: 'mW',
  //   range: [0, 1000],
  //   defaults: {
  //     min: 1,
  //     max: 10,
  //     steps: 100,
  //   },
  // },
  // {
  //   label: 'Pump Bandwidth FWHM',
  //   prop: 'pump.bandwidth_nm',
  //   units: 'nm',
  //   range: [0, 10000],
  //   defaults: {
  //     min: 1,
  //     max: 10,
  //     steps: 100,
  //   },
  // },
]

export default {
  name: 'pm-histogram',
  mixins: [panelMixin],
  data: () => ({
    panelSettings: {
      enableLogScale: false,
      highlightZero: false,
      xProp: PROPS[0].label,
      yProp: PROPS[1].label,

      xranges: {
        ...PROPS.reduce((acc, p) => {
          acc[p.label] = { ...p.defaults }
          return acc
        }, {}),
      },
      yranges: {
        ...PROPS.reduce((acc, p) => {
          acc[p.label] = { ...p.defaults }
          return acc
        }, {}),
      },
    },
    plotView: {},
    props: PROPS.map((p) => p.label),
    loading: false,
    intensities: [],
  }),
  components: {
    SPDHistogram,
  },
  computed: {
    xTitle() {
      return this.panelSettings.xProp
    },
    yTitle() {
      return this.panelSettings.yProp
    },
    xprop() {
      return PROPS.find((p) => p.label === this.panelSettings.xProp)
    },
    yprop() {
      return PROPS.find((p) => p.label === this.panelSettings.yProp)
    },
    xRange() {
      return this.panelSettings.xranges[this.panelSettings.xProp]
    },
    yRange() {
      return this.panelSettings.yranges[this.panelSettings.yProp]
    },
    axes() {
      return this.getAxes()
    },
    ...mapGetters('parameters', ['spdConfig', 'integrationConfig']),
  },
  watch: {
    'xRange.min': 'checkRecalculate',
    'xRange.max': 'checkRecalculate',
    'xRange.steps': 'checkRecalculate',
    'yRange.min': 'checkRecalculate',
    'yRange.max': 'checkRecalculate',
    'yRange.steps': 'checkRecalculate',
    'panelSettings.xProp': 'checkRecalculate',
    'panelSettings.yProp': 'checkRecalculate',
  },
  created() {
    this.$on('parametersUpdated', () => this.calculate())
  },
  methods: {
    redraw() {
      if (!this.panelSettings.autoUpdate) {
        return
      }
      this.calculate()
    },
    calcWavelengthSpectrum: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getPmCurve',
        this.spdConfig,
        this.xprop.prop,
        this.yprop.prop,
        {
          x_range: [this.xRange.min, this.xRange.max],
          y_range: [this.yRange.min, this.yRange.max],
          x_count: this.xRange.steps,
          y_count: this.yRange.steps,
        }
      )
    }),
    async calculate() {
      this.loading = true

      try {
        let { result, duration } = await this.calcWavelengthSpectrum()
        this.intensities = createGroupedArray(result, this.xRange.steps)
        this.status = `done in ${duration.toFixed(2)}ms`
      } catch (error) {
        this.$store.dispatch('error', {
          error,
          context: 'while calculating JSI',
        })
      } finally {
        this.loading = false
      }
    },
    getAxes() {
      let x0 = this.xRange.min
      let dx = (this.xRange.max - this.xRange.min) / (this.xRange.steps - 1)
      let y0 = this.yRange.min
      let dy = (this.yRange.max - this.yRange.min) / (this.yRange.steps - 1)

      return {
        x0,
        dx,
        y0,
        dy,
      }
    },
    applyRange() {
      const xrange = this.plotView.xRange
      const yrange = this.plotView.yRange

      this.xRange.min = xrange[0]
      this.xRange.max = xrange[1]
      this.yRange.min = yrange[0]
      this.yRange.max = yrange[1]

      this.calculate()
    },
  },
}
</script>

<style lang="sass" scoped>
.full-width
  min-width: 90% !important
.dash
  flex: none !important
  min-width: 0 !important
  padding: 6px
.jsi
  .switch
    padding: 0px 8px
    align-items: center
    ::v-deep(.v-input__slot)
      margin-bottom: 0
    ::v-deep(.v-messages)
      display: none
  ::v-deep(.v-toolbar__content .v-btn.v-btn--icon)
    height: 40px
    width: 40px
</style>
