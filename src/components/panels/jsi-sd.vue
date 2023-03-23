<template lang="pug">
SPDPanel(
  title="JSI Sum-Diff axes"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  SPDHistogram(
    :chart-data="intensities"
    , :axes="axes"
    , :log-scale="panelSettings.enableLogScale"
    , :highlight-zero="panelSettings.highlightZero"
    , x-title="(wi + ws) / 2 (THz)"
    , y-title="(wi - ws) / 2 (THz)"
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
import _max from 'lodash/max'
import panelMixin from '@/components/panel.mixin'
import { mapGetters, mapMutations } from 'vuex'
import SPDHistogram from '@/components/spd-histogram.vue'
import { createGroupedArray } from '@/lib/data-utils'
import { interruptDebounce } from '../../lib/batch-worker'

let c = 299792458
let twoPic = Math.PI * 2 * c
let terra = 1e12
let nano = 1e-9

export default {
  name: 'jsi-sd'
  , mixins: [panelMixin]
  , data: () => ({
    panelSettings: {
      enableLogScale: false
      , highlightZero: false
    }
    , plotView: null
    , loading: false
    , intensities: []
    , axes: {}
  })
  , components: {
    SPDHistogram
  }
  , computed: {
    ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
  }
  , created() {
    this.$on('parametersUpdated', () => this.calculate())
  }
  , methods: {
    redraw() {
      if (!this.panelSettings.autoUpdate) { return }
      this.calculate()
    }
    , calcSpectrum: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getJSISumDiff'
        , this.spdConfig
        , this.integrationConfig
      )
    })
    , async calculate() {
      this.loading = true

      try {
        const { result, duration } = await this.calcSpectrum()

        const max = _max(result)
        this.intensities = createGroupedArray(result.map(i => i / max), this.integrationConfig.size)
        this.axes = this.getAxes()

        const totalTime = duration
        this.status = `done in ${totalTime.toFixed(2)}ms`
      } catch (error) {
        this.$store.dispatch('error', { error, context: 'while calculating JSI' })
      } finally {
        this.loading = false
      }
    }
    , getAxes() {
      let cfg = this.integrationConfig
      let k = twoPic / nano / terra
      let wsMin = k / cfg.ls_max
      let wsMax = k / cfg.ls_min
      let wiMin = k / cfg.li_max
      let wiMax = k / cfg.li_min
      // x: s = (wi + ws) / 2
      // y: d = (wi - ws) / 2
      let sMin = (wiMin + wsMin) / 2
      let sMax = (wiMax + wsMax) / 2
      let dMin = (wiMin - wsMax) / 2
      let dMax = (wiMax - wsMin) / 2
      let x0 = sMin
      let dx = (sMax - x0) / (cfg.size - 1)
      let y0 = dMin
      let dy = (dMax - y0) / (cfg.size - 1)
      return {
        x0
        , dx
        , y0
        , dy
      }
    }
    , applyRange() {
      const k = twoPic / terra / nano
      const sRange = this.plotView.xRange
      const dRange = this.plotView.yRange
      const [sMin, sMax] = sRange
      const [dMin, dMax] = dRange
      const wsMin = 0.25 * (3 * sMin + sMax - dMin - 3 * dMax)
      const wsMax = 0.25 * (sMin + 3 * sMax - 3 * dMin - dMax)
      const wiMin = 0.25 * (3 * sMin + sMax + 3 * dMin + dMax)
      const wiMax = 0.25 * (sMin + 3 * sMax + dMin + 3 * dMax)

      this.setAutoCalcIntegrationLimits(false)
      this.setIntegrationXMin(k / wsMax)
      this.setIntegrationXMax(k / wsMin)
      this.setIntegrationYMin(k / wiMax)
      this.setIntegrationYMax(k / wiMin)
    }
    , ...mapMutations('parameters', [
      'setIntegrationXMin'
      , 'setIntegrationXMax'
      , 'setIntegrationYMin'
      , 'setIntegrationYMax'
      , 'setAutoCalcIntegrationLimits'
    ])
  }
}
</script>

<style lang="sass" scoped>
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
