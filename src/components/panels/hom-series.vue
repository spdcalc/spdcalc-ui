<template lang="pug">
SPDPanel(
  title="Hong-Ou-Mandel Time Series"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="2"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="Δt min"
        , v-model="panelSettings.xaxis.min"
        , tooltip="The minimum time delay to plot"
        , :sigfigs="2"
        , units="fs"
        , lazy
      )
      ParameterInput(
        label="Δt max"
        , v-model="panelSettings.xaxis.max"
        , tooltip="The maximum time delay to plot"
        , :sigfigs="2"
        , units="fs"
        , lazy
      )
      ParameterInput(
        label="Steps"
        , v-model="panelSettings.xaxis.steps"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="JSI Resolution"
        , v-model="panelSettings.jsiResolution"
        , step="2"
        , :sigfigs="0"
        , lazy
      )
  SPDLinePlot(
    :x-data="xAxisData"
    , :y-data="data"
    , :plotly-config="plotlyConfig"
    , x-title="Time Delay (fs)"
    , y-title="Coincidence Rate"
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
    span.result Visibility: {{visibility.toFixed(4)}}
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
  name: 'hom-series'
  , mixins: [panelMixin]
  , data: () => ({
    panelSettings: {
      xaxis: {
        min: -400
        , max: 800
        , steps: 200
      }
      , jsiResolution: 100
    }
    , data: null
    , xAxisData: []
    , resizeCount: 0
    , plotView: null
    , plotlyConfig: {
      layout: {
        yaxis: {
          rangemode: 'tozero'
        }
        , xaxis: {
          rangemode: 'normal'
        }
      }
    }
    , visibility: 0
  })
  , components: {
    SPDLinePlot
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
  , watch: {
    'panelSettings': {
      handler: 'redraw'
      , deep: true
    }
  }
  , methods: {
    redraw(){
      if ( !this.panelSettings.autoUpdate ){ return }
      this.calculate()
    }
    , getXAxisData(){
      const xaxis = this.panelSettings.xaxis
      return this.getStepArray(xaxis.min, xaxis.max, xaxis.steps)
    }
    , calcVisibility: interruptDebounce(function () {
      let ic = { ...this.integrationConfig, size: this.panelSettings.jsiResolution }
      return this.spdWorkers.execSingle(
        'getHOMVisibility'
        , this.spdConfig
        , ic
      )
    })
    , calcSeries: interruptDebounce(function () {
      let xaxis = this.panelSettings.xaxis
      let ic = { ...this.integrationConfig, size: this.panelSettings.jsiResolution }
      return this.spdWorkers.execSingle(
        'getHOMSeries'
        , this.spdConfig
        , ic
        , _mapValues(xaxis, v => +v)
      )
    })
    , calculate: _debounce(async function(){
      this.loading = true
      this.data = null

      try {
        let { result: visResult, duration: duration2 } = await this.calcVisibility()
        let { result, duration } = await this.calcSeries()

        this.data = result
        this.visibility = visResult[1]
        this.xAxisData = this.getXAxisData()
        const totalDuration = duration + duration2
        this.status = `done in ${totalDuration.toFixed(2)}ms`

      } catch ( error ) {
        this.$store.dispatch('error', { error, context: 'while calculating HOM' })
      } finally {
        setTimeout(() => {
          this.loading = false
        }, 100)
      }
    }, 500)
    , applyRange(){
      const xRange = this.plotView.xRange
      this.panelSettings.xaxis = {
        min: xRange[0]
        , max: xRange[1]
        , steps: this.panelSettings.xaxis.steps
      }
    }
  }
}
</script>

<style lang="sass">
</style>
