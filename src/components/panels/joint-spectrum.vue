<template lang="pug">
SPDPanel(
  title="Joint Spectrum"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  template(#secondary-toolbar)
    .props-toolbar
        ParameterSelector(
          v-model="panelSettings.axisType"
          , :items="axisTypes"
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
        , :zrange="zranges.intensities"
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
    v-tab-item(key="Amplitude")
      SPDHistogram(
        :chart-data="amplitudes"
        , :axes="axes"
        , :zrange="zranges.amplitudes"
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
    v-tab-item(key="Phase")
      SPDHistogram(
        :chart-data="phases"
        , :axes="axes"
        , :is-angle="true"
        , :usegl="false"
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
  template(#result-bar)
    span.result Schmidt number: {{schmidtNumber}}
</template>

<script>
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
  name: 'joint-spectrum'
  , mixins: [panelMixin]
  , data: () => ({
    panelSettings: {
      enableLogScale: false
      , highlightZero: false
      , axisType: 'Wavelength'
    }
    , selectedTab: 'Intensity'
    , axisTypes: ['Wavelength', 'Frequency', 'SumDiff']
    , tabs: ['Intensity', 'Amplitude', 'Phase']
    , plotView: null
    , loading: false
    , spectrumData: {}
    , zranges: {
      intensities: [0, 1]
      , amplitudes: [0, 1]
    }
  })
  , components: {
    SPDHistogram
  }
  , computed: {
    xTitle(){
      switch ( this.panelSettings.axisType ){
        case 'Wavelength':
          return 'Signal wavelength (nm)'
        case 'Frequency':
          return 'Signal frequency (THz)'
        case 'SumDiff':
          return '½(ωi + ωs) (THz)'
      }
      return ''
    }
    , yTitle(){
      switch ( this.panelSettings.axisType ){
        case 'Wavelength':
          return 'Idler wavelength (nm)'
        case 'Frequency':
          return 'Idler frequency (THz)'
        case 'SumDiff':
          return '½(ωi - ωs) (THz)'
      }
      return ''
    }
    , intensities(){
      let result = this.spectrumData[this.panelSettings.axisType]
      if ( !result ){
        return []
      }
      return createGroupedArray(result.intensities, this.integrationConfig.size)
    }
    , amplitudes(){
      let result = this.spectrumData[this.panelSettings.axisType]
      if ( !result ){
        return []
      }
      return createGroupedArray(result.amplitudes, this.integrationConfig.size)
    }
    , phases(){
      let result = this.spectrumData[this.panelSettings.axisType]
      if ( !result ){
        return []
      }
      return createGroupedArray(result.phases, this.integrationConfig.size)
    }
    , axes(){
      return this.getAxes()
    }
    , schmidtNumber(){
      let result = this.spectrumData[this.panelSettings.axisType]
      if ( !result ){
        return 0
      }
      return result.schmidt_number.toFixed(3)
    }
    , ...mapGetters('parameters', [
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
    , calcWavelengthSpectrum: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getJointSpectrum'
        , this.spdConfig
        , this.integrationConfig
      )
    })
    , calcFrequencySpectrum: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getJointSpectrumFreq'
        , this.spdConfig
        , this.integrationConfig
      )
    })
    , calcSumDiffSpectrum: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getJointSpectrumSumDiff'
        , this.spdConfig
        , this.integrationConfig
      )
    })
    , async calculate(){
      this.loading = true

      try {
        this.spectrumData = await Promise.all([
          this.calcWavelengthSpectrum()
          , this.calcFrequencySpectrum()
          , this.calcSumDiffSpectrum()
        ]).then(([Wavelength, Frequency, SumDiff]) => {
          return {
            Wavelength: Wavelength.result
            , Frequency: Frequency.result
            , SumDiff: SumDiff.result
            , duration: Math.max(Wavelength.duration, Frequency.duration, SumDiff.duration)
          }
        })

        const totalTime = this.spectrumData.duration
        this.status = `done in ${totalTime.toFixed(2)}ms`
      } catch ( error ) {
        this.$store.dispatch('error', { error, context: 'while calculating JSI' })
      } finally {
        this.loading = false
      }
    }
    , getWavelengthAxes(){
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
    , getFrequencyAxes(){
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
    , getSumDiffAxes(){
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
    , getAxes(){
      switch ( this.panelSettings.axisType ){
        case 'Wavelength':
          return this.getWavelengthAxes()
        case 'Frequency':
          return this.getFrequencyAxes()
        case 'SumDiff':
          return this.getSumDiffAxes()
      }
    }
    , applyWavelengthRange(){
      const signalRange = this.plotView.xRange
      const idlerRange = this.plotView.yRange

      this.setAutoCalcIntegrationLimits(false)
      this.setIntegrationXMin(signalRange[0])
      this.setIntegrationXMax(signalRange[1])
      this.setIntegrationYMin(idlerRange[0])
      this.setIntegrationYMax(idlerRange[1])
    }
    , applyFrequencyRange(){
      const k = twoPic / terra / nano
      const signalRange = this.plotView.xRange.map(v => k / v)
      const idlerRange = this.plotView.yRange.map(v => k / v)

      this.setAutoCalcIntegrationLimits(false)
      this.setIntegrationXMin(signalRange[1])
      this.setIntegrationXMax(signalRange[0])
      this.setIntegrationYMin(idlerRange[1])
      this.setIntegrationYMax(idlerRange[0])
    }
    , applySumDiffRange(){
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
    , applyRange(){
      switch ( this.panelSettings.axisType ){
        case 'Wavelength':
          return this.applyWavelengthRange()
        case 'Frequency':
          return this.applyFrequencyRange()
        case 'SumDiff':
          return this.applySumDiffRange()
      }
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
