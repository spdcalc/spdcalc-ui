<template lang="pug">
SPDPanel(
  title="Debug"
  , @refresh="calculate"
  , @cancel="cancel"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="2"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  SPDLinePlot(
    :chart-data="combined"
    , :plotly-config="plotlyConfig"
    , x-title="x"
    , y-title="y"
    , y2-title="y2"
    , @updatedView="plotView = $event"
  )
</template>

<script>
import panelMixin from '@/components/panel.mixin'
import { mapGetters } from 'vuex'
import SPDLinePlot from '@/components/spd-line-plot.vue'
import _debounce from 'lodash/debounce'
import { interruptDebounce } from '../../lib/batch-worker'

export default {
  name: 'debug-plot',
  mixins: [panelMixin],
  data: () => ({
    data: [],
    xAxisData: [],
    resizeCount: 0,
    autosize: true,
    plotView: null,
    plotlyConfig: {
      layout: {
        yaxis: {
          rangemode: 'tozero',
        },
        xaxis: {
          rangemode: 'normal',
        },
        yaxis2: {
          title: 'y2',
          rangemode: 'tozero',
          overlaying: 'y',
          side: 'right',
        },
      },
    },
    visibility: 0,
  }),
  components: {
    SPDLinePlot,
  },
  computed: {
    combined() {
      const mid = this.spdConfig.periodic_poling_enabled
        ? this.spdConfig.poling_period
        : this.spdConfig.crystal_theta
      let dx = 0.01 * mid
      return this.data.map((d, i) => {
        return {
          x: this.getStepArray(mid - dx, mid + dx, d.length),
          y: d,
          name: 'center',
          mode: 'lines',
          yaxis: i > 0 ? 'y2' : null,
          line: {
            width: 1,
          },
        }
      })
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
    calcDeltakSeries: interruptDebounce(function () {
      const method = this.spdConfig.periodic_poling_enabled
        ? 'getDeltaKVsPP'
        : 'getDeltaKVsCrystalTheta'
      return this.spdWorkers.execSingle(
        // 'getDeltaKVsCrystalTheta'
        // 'getCenterJsiVsCrystalTheta'
        method,
        this.spdConfig
      )
    }),
    calcJsiSeries: interruptDebounce(function () {
      const method = this.spdConfig.periodic_poling_enabled
        ? 'getCenterJsiVsPP'
        : 'getCenterJsiVsCrystalTheta'
      return this.spdWorkers.execSingle(
        // 'getDeltaKVsCrystalTheta'
        // 'getCenterJsiVsCrystalTheta'
        method,
        this.spdConfig
      )
    }),
    calculate: _debounce(async function () {
      this.loading = true
      this.data = null

      try {
        let results = await Promise.all([
          this.calcDeltakSeries(),
          this.calcJsiSeries(),
        ])

        this.data = results.map((r) => r.result)
        let duration = results.reduce((acc, r) => Math.max(r.duration, acc), 0)
        this.status = `done in ${duration.toFixed(2)}ms`
      } catch (error) {
        this.$store.dispatch('error', {
          error,
          context: 'while calculating debug plot',
        })
      } finally {
        setTimeout(() => {
          this.loading = false
        }, 100)
      }
    }, 500),
  },
}
</script>

<style lang="sass"></style>
