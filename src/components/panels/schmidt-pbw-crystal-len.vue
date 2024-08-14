<template lang="pug">
SPDPanel(
  title="Schmidt Number (Pump Bandwidth vs Crystal Length)"
  , @refresh="calculate"
  , @cancel="cancel"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
  , toolbar-rows="3"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="xmin"
        , v-model="panelSettings.grid2d.x_range[0]"
        , :min="0.01"
        , units="µm"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="xmax"
        , v-model="panelSettings.grid2d.x_range[1]"
        , :min="0.01"
        , units="µm"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="ymin"
        , v-model="panelSettings.grid2d.y_range[0]"
        , :min="1e-6"
        , units="nm"
        , lazy
        , :sigfigs="2"
      )
      ParameterInput(
        label="ymax"
        , v-model="panelSettings.grid2d.y_range[1]"
        , :min="1e-6"
        , units="nm"
        , lazy
        , :sigfigs="2"
      )
    .props-toolbar
      ParameterInput(
        label="Grid Size"
        , v-model="steps"
        , :min="1"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="JSI Resolution"
        , v-model="panelSettings.resolution"
        , step="1"
        , :min="1"
        , :sigfigs="0"
        , tooltip="The grid size of the JSA integration"
        , lazy
      )
  SPDHistogram(
    :chart-data="data"
    , :axes="axes"
    , x-title="Crystal Length (µm)"
    , y-title="Pump Bandwidth (FWHM nm)"
    , :min-color="minColor"
    , :max-color="maxColor"
    , :usegl="false"
    , :zrange="zrange"
    , @updatedView="plotView = $event"
  )
    template(#chart-bar)
      IconButton(
        v-if="plotView"
        , icon="mdi-target-variant"
        , tooltip="compute data over current plot view"
        , @click="applyRange"
      )
</template>

<script>
import { mapGetters } from 'vuex'
import panelMixin from '@/components/panel.mixin'
import SPDHistogram from '@/components/spd-histogram.vue'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import { createGroupedArray } from '@/lib/data-utils'
import colors from '@/spd-colors.js'
import { interruptDebounce } from '../../lib/batch-worker'

export default {
  name: 'schmidt-pbw-crystal-len',
  mixins: [panelMixin],
  props: {},
  data: () => ({
    loading: false,
    panelSettings: {
      grid2d: {
        x_range: [1000, 25000],
        y_range: [0.5, 5],
        x_count: 10,
        y_count: 10,
      },
      resolution: 30,
    },
    plotView: null,
    axes: {},
    results: [],
    maxColor: colors.badColor,
    minColor: 'white',
  }),
  components: {
    SPDHistogram,
    ParameterInput,
  },
  watch: {
    'panelSettings.grid2d.x_range.0': 'checkRecalculate',
    'panelSettings.grid2d.x_range.1': 'checkRecalculate',
    'panelSettings.grid2d.y_range.0': 'checkRecalculate',
    'panelSettings.grid2d.y_range.1': 'checkRecalculate',
    steps: 'checkRecalculate',
    'panelSettings.resolution': 'checkRecalculate',
  },
  computed: {
    ranges() {
      const nm = 1e-9
      const um = 1e-6
      let r = this.panelSettings.grid2d
      return {
        ...r,
        x_range: [r.x_range[0] * um, r.x_range[1] * um],
        y_range: [r.y_range[0] * nm, r.y_range[1] * nm],
      }
    },
    steps: {
      get() {
        return this.panelSettings.grid2d.x_count
      },
      set(s) {
        this.panelSettings.grid2d.x_count = s | 0
        this.panelSettings.grid2d.y_count = s | 0
      },
    },
    zrange() {
      const max = this.results.reduce((m, n) => Math.max(m, n), 0)
      return [1, max]
    },
    data() {
      return createGroupedArray(this.results, this.steps)
    },
    ...mapGetters('parameters', ['spdConfig', 'integrationConfig']),
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
    calculate() {
      const ranges = this.ranges
      this.loading = true
      this.results = []
      this.runBatch(ranges)
        .then(({ result, duration }) => {
          this.results = result
          this.axes = this.getAxes()
          this.status = `done in ${duration.toFixed(2)}ms`
        })
        .catch((error) => {
          this.$store.dispatch('error', {
            error,
            context: 'while calculating schmidt number histogram',
          })
        })
        .finally(() => {
          this._promise = null
          setTimeout(() => {
            this.loading = false
          }, 100)
        })
    },
    getAxes() {
      let cfg = this.panelSettings.grid2d
      let x0 = cfg.x_range[0]
      let dx = (cfg.x_range[1] - x0) / (cfg.x_count - 1)
      let y0 = cfg.y_range[0]
      let dy = (cfg.y_range[1] - y0) / (cfg.y_count - 1)
      return {
        x0,
        dx,
        y0,
        dy,
      }
    },
    runBatch: interruptDebounce(function (ranges) {
      let partitions = this.spdWorkers.partitionSteps(
        ranges.y_range,
        ranges.y_count
      )
      let args = partitions.map((p) => {
        let batchRange = {
          ...ranges,
          y_range: p.range,
          y_count: p.count,
        }

        return [
          this.spdConfig,
          { ...this.integrationConfig, size: this.panelSettings.resolution },
          batchRange,
        ]
      })

      return this.spdWorkers.execAndConcat(
        'getSchmidtPumpBwVsCrystalLength',
        args
      )
    }),
    applyRange() {
      this.panelSettings.grid2d.x_range = this.plotView.xRange
      this.panelSettings.grid2d.y_range = this.plotView.yRange
    },
  },
}
</script>

<style lang="sass"></style>
