<template lang="pug">
SPDPanel(
  title="Joint Spectral Intensity"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  SPDHistogram(
    :chart-data="data"
    , :axes="axes"
    , :log-scale="panelSettings.enableLogScale"
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
</template>

<script>
import panelMixin from '@/components/panel.mixin'
import { mapGetters, mapMutations } from 'vuex'
import SPDHistogram from '@/components/spd-histogram.vue'
import { createGroupedArray } from '@/lib/data-utils'

export default {
  name: 'jsi'
  , mixins: [panelMixin]
  , data: () => ({
    panelSettings: {
      enableLogScale: false
    }
    , plotView: null
    , loading: false
    , data: []
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
    , calculate(){
      this.loading = true

      this.spdWorkers.execSingle(
        'getJSI'
        , this.spdConfig
        , this.integrationConfig
      ).then( ({ result, duration }) => {
        this.data = createGroupedArray(result, this.integrationConfig.size)
        this.axes = this.getAxes()
        this.status = `done in ${duration.toFixed(2)}ms`
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating JSI' })
      }).finally(() => {
        this.loading = false
      })
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
