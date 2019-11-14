<template lang="pug">
SPDPanel(
  title="Hong-Ou-Mandel Time Series"
  , @refresh="redraw"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="2"
  , :auto-update.sync="panelSettings.autoUpdate"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="Time delay (min)"
        , v-model="panelSettings.xaxis.min"
        , :sigfigs="2"
        , units="fs"
        , lazy
      )
      ParameterInput(
        label="Time delay (max)"
        , v-model="panelSettings.xaxis.max"
        , :sigfigs="2"
        , units="fs"
        , lazy
      )
    .props-toolbar
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
        , step="1"
        , :sigfigs="0"
        , lazy
      )
  SPDLinePlot(
    :x-data="xAxisData"
    , :y-data="data"
    , x-title="Time Delay (fs)"
    , y-title="Coincidence Rate"
    , @relayout="onRelayout"
  )
</template>

<script>
import panelMixin from '@/components/panel.mixin'
import { mapGetters } from 'vuex'
import SPDPanel from '@/components/spd-panel'
import SPDLinePlot from '@/components/spd-line-plot'
import ParameterInput from '@/components/inputs/parameter-input'
import d3 from 'd3'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import _mapValues from 'lodash/mapValues'
import CreateWorker from '@/workers/spdcalc'
// new thread
const spdcalc = new CreateWorker()

export default {
  name: 'hom-series'
  , mixins: [panelMixin]
  , data: () => ({
    loading: false
    , panelSettings: {
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
  })
  , components: {
    SPDPanel
    , SPDLinePlot
    , ParameterInput
  }
  , computed: {
    ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
  }
  , created(){
  }
  , mounted(){
    this.$on('parametersUpdated', () => this.redraw())
    this.redraw()
  }
  , watch: {
    panelSettings(){
      this.redraw()
    }
  }
  , methods: {
    redraw(){
      this.calculate(this.panelSettings.xaxis)
    }
    , getXAxisData(){
      const xaxis = this.panelSettings.xaxis
      const steps = xaxis.steps
      const stepper = d3.interpolateNumber(xaxis.min, xaxis.max)
      return _times(steps, n => stepper(n / steps))
    }
    , calculate: _debounce(function(timeSteps){
      this.loading = true
      let ic = { ...this.integrationConfig, size: this.panelSettings.jsiResolution }
      spdcalc.getHOMSeries(this.spdConfig, ic, _mapValues( timeSteps, v => +v )).then( rateData => {
        this.data = rateData
        this.timeSteps = timeSteps
        this.xAxisData = this.getXAxisData()
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating HOM' })
      }).finally(() => {
        setTimeout(() => {
          this.loading = false
        }, 100)
      })
    }, 500)
    , onRelayout(layout){
      const xaxis = this.panelSettings.xaxis
      if (
        !this.loading &&
        layout['xaxis.range[0]'] &&
        (layout['xaxis.range[0]'] !== xaxis.min ||
        layout['xaxis.range[1]'] !== xaxis.max)
      ){
        let timeSteps = {
          ...xaxis
          , min: layout['xaxis.range[0]']
          , max: layout['xaxis.range[1]']
        }

        this.calculate(timeSteps)
      }
    }
  }
}
</script>

<style lang="sass">
</style>
