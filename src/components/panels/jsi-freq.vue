<template lang="pug">
SPDPanel(
  title="JSI Frequency Space"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  SPDHistogram(
    :chart-data="intensities"
    , :axes="axes"
    , :zrange="zrange"
    , :log-scale="panelSettings.enableLogScale"
    , :highlight-zero="panelSettings.highlightZero"
    , x-title="Signal Frequency (THz)"
    , y-title="Idler Frequency (THz)"
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
  name: 'jsi-freq'
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
    , zrange: null
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
        'getJSIFreq'
        , this.spdConfig
        , this.integrationConfig
      )
    })
    , async calculate() {
      this.loading = true

      try {
        const { result, duration } = await this.calcSpectrum()

        // const max = _max(result)
        this.zrange = [0, 1]
        this.intensities = createGroupedArray(result, this.integrationConfig.size)
        this.axes = this.getAxes()
        console.log('sum', result.reduce((s, i) => s + i, 0))

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
      let x0 = twoPic / (nano * cfg.ls_max) / terra
      let dx = ((twoPic / ((nano * cfg.ls_min)) / terra) - x0) / (cfg.size - 1)
      let y0 = twoPic / (nano * cfg.li_max) / terra
      let dy = ((twoPic / ((nano * cfg.li_min)) / terra) - y0) / (cfg.size - 1)
      return {
        x0
        , dx
        , y0
        , dy
      }
    }
    , applyRange() {
      const k = twoPic / terra / nano
      const signalRange = this.plotView.xRange.map(v => k / v)
      const idlerRange = this.plotView.yRange.map(v => k / v)

      this.setAutoCalcIntegrationLimits(false)
      this.setIntegrationXMin(signalRange[1])
      this.setIntegrationXMax(signalRange[0])
      this.setIntegrationYMin(idlerRange[1])
      this.setIntegrationYMax(idlerRange[0])
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
