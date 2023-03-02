<template lang="pug">
SPDPanel(
  title="Joint Spectrum"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  v-tabs(v-model="selectedTab", fixed-tabs, dark, background-color="panel", transition="none")
    v-tab(
      v-for="tab in tabs"
      :key="tab"
    )
      | {{ tab }}
  v-tabs-items(v-model="selectedTab")
    v-tab-item(key="Intensity")
      SPDHistogram(
        :chart-data="intensities"
        , :axes="axes"
        , :log-scale="panelSettings.enableLogScale"
        , :highlight-zero="panelSettings.highlightZero"
        , x-title="Signal wavelength (nm)"
        , y-title="Idler wavelength (nm)"
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
    v-tab-item(key="Amplitude")
      SPDHistogram(
        :chart-data="amplitudes"
        , :axes="axes"
        , :log-scale="panelSettings.enableLogScale"
        , :highlight-zero="panelSettings.highlightZero"
        , x-title="Signal wavelength (nm)"
        , y-title="Idler wavelength (nm)"
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
    v-tab-item(key="Phase")
      SPDHistogram(
        :chart-data="phases"
        , :axes="axes"
        , :is-angle="true"
        , :usegl="false"
        , x-title="Signal wavelength (nm)"
        , y-title="Idler wavelength (nm)"
        , @updatedView="plotView = $event"
      )
        template(#chart-bar)
          IconButton(
            v-if="plotView"
            , icon="mdi-target-variant"
            , tooltip="compute data over current plot view"
            , @click="applyRange"
          )
  template(#result-bar)
    span.result Schmidt number: {{schmidtNumber}}
</template>

<script>
import _max from 'lodash/max'
import panelMixin from '@/components/panel.mixin'
import { mapGetters, mapMutations } from 'vuex'
import SPDHistogram from '@/components/spd-histogram.vue'
import { createGroupedArray } from '@/lib/data-utils'

export default {
  name: 'joint-spectrum'
  , mixins: [panelMixin]
  , data: () => ({
    panelSettings: {
      enableLogScale: false
      , highlightZero: false
    }
    , selectedTab: 'Intensity'
    , tabs: ['Intensity', 'Amplitude', 'Phase']
    , plotView: null
    , loading: false
    , schmidtNumber: 0
    , intensities: []
    , amplitudes: []
    , phases: []
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
  , created(){
    this.$on('parametersUpdated', () => this.calculate())
  }
  , methods: {
    redraw(){
      if ( !this.panelSettings.autoUpdate ){ return }
      this.calculate()
    }
    , async calculate(){
      this.loading = true

      try {
        const { result, duration } = await this.spdWorkers.execSingle(
          'getJointSpectrum'
          , this.spdConfig
          , this.integrationConfig
        )

        const max = _max(result.intensities)
        result.intensities = result.intensities.map(i => i / max)
        const maxamp = Math.sqrt(max)
        result.amplitudes = result.amplitudes.map(a => a / maxamp)

        this.intensities = createGroupedArray(result.intensities, this.integrationConfig.size)
        this.amplitudes = createGroupedArray(result.amplitudes, this.integrationConfig.size)
        this.phases = createGroupedArray(result.phases, this.integrationConfig.size)
        this.axes = this.getAxes()

        this.schmidtNumber = result.schmidt_number.toFixed(3)

        const totalTime = duration
        this.status = `done in ${totalTime.toFixed(2)}ms`
      } catch ( error ) {
        this.$store.dispatch('error', { error, context: 'while calculating JSI' })
      } finally {
        this.loading = false
      }
    }
    , getAxes(){
      let cfg = this.integrationConfig
      let x0 = cfg.ls_min
      let dx = (cfg.ls_max - x0) / (cfg.size - 1)
      let y0 = cfg.li_min
      let dy = (cfg.li_max - y0) / (cfg.size - 1)
      return {
        x0
        , dx
        , y0
        , dy
      }
    }
    , applyRange(){
      const signalRange = this.plotView.xRange
      const idlerRange = this.plotView.yRange

      this.setAutoCalcIntegrationLimits(false)
      this.setIntegrationXMin(signalRange[0])
      this.setIntegrationXMax(signalRange[1])
      this.setIntegrationYMin(idlerRange[0])
      this.setIntegrationYMax(idlerRange[1])
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
