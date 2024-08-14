<template lang="pug">
SPDPanel(
  title="Integrand"
  , @refresh="calculate"
  , @cancel="cancel"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="2"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="Steps"
        , v-model="panelSettings.xaxis.steps"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="ls"
        , v-model="panelSettings.ls"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="li"
        , v-model="panelSettings.li"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
  SPDLinePlot(
    :x-data="xAxisData"
    , :y-data="data"
    , :plotly-config="plotlyConfig"
    , x-title="z"
    , @updatedView="plotView = $event"
  )
</template>

<script>
import panelMixin from '@/components/panel.mixin'
import { mapGetters } from 'vuex'
import SPDLinePlot from '@/components/spd-line-plot.vue'
import _min from 'lodash/min'
import _mapValues from 'lodash/mapValues'
import _debounce from 'lodash/debounce'
import { interruptDebounce } from '../../lib/batch-worker'

export default {
  name: 'integrand-series',
  mixins: [panelMixin],
  data: () => ({
    panelSettings: {
      xaxis: {
        min: -1,
        max: 1,
        steps: 1000,
      },
      ls: 1550,
      li: 1550,
      jsiResolution: 100,
    },
    data: null,
    xAxisData: [],
    resizeCount: 0,
    plotView: null,
    plotlyConfig: {
      layout: {
        yaxis: {
          rangemode: 'tozero',
        },
        xaxis: {
          rangemode: 'normal',
        },
      },
    },
    visibility: 0,
  }),
  components: {
    SPDLinePlot,
  },
  computed: {
    ...mapGetters('parameters', ['spdConfig', 'integrationConfig']),
  },
  created() {
    this.$on('parametersUpdated', () => this.calculate())
  },
  watch: {
    panelSettings: {
      handler: 'redraw',
      deep: true,
    },
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
      return this.getStepArray(xaxis.min, xaxis.max, xaxis.steps)
    },
    calcSeries: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getPmIntegrand',
        this.spdConfig,
        this.panelSettings.ls,
        this.panelSettings.li
      )
    }),
    calculate: _debounce(async function () {
      this.loading = true
      this.data = null

      try {
        let { result, duration } = await this.calcSeries()
        this.data = result.im
        this.xAxisData = this.getXAxisData()
        const totalDuration = duration
        this.status = `done in ${totalDuration.toFixed(2)}ms`
      } catch (error) {
        this.$store.dispatch('error', {
          error,
          context: 'while calculating integrand',
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
