<template lang="pug">
SPDModule(
  title="Hong-Ou-Mandel Time Series"
  , @refresh="redraw"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="1"
)
  template(#secondary-toolbar)
    v-toolbar-items.props-toolbar
      ParameterInput(
        label="Steps"
        , v-model="timeSteps.steps"
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
import { mapGetters } from 'vuex'
import SPDModule from '@/components/spd-module'
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
  , props: {
    color: {
      type: String
      , default: '#34495e'
    }
  }
  , data: () => ({
    loading: false
    , timeSteps: {
      min: -400 * 1e-15
      , max: 800 * 1e-15
      , steps: 200
    }
    , data: null
    , xAxisData: []
    , resizeCount: 0
  })
  , components: {
    SPDModule
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
    this.calculate = _debounce(this.calculate.bind(this), 500)
  }
  , mounted(){
    const unwatch = this.$store.watch(
      (state, getters) => getters['parameters/isReady'] &&
        !getters['parameters/isEditing'] &&
        ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , ( refresh ) => refresh && this.redraw()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
    })
  }
  , watch: {
    'timeSteps.steps': {
      handler(){
        this.redraw()
      }
    }
  }
  , methods: {
    redraw(){
      this.calculate(this.timeSteps)
    }
    , getXAxisData(){
      const steps = this.timeSteps.steps
      const stepper = d3.interpolateNumber(this.timeSteps.min, this.timeSteps.max)
      return _times(steps, n => stepper(n / steps))
    }
    , calculate(timeSteps){
      this.loading = true
      spdcalc.getHOMSeries(this.spdConfig, this.integrationConfig, _mapValues( timeSteps, v => +v )).then( rateData => {
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
    }
    , onRelayout(layout){
      if (
        !this.loading &&
        layout['xaxis.range[0]'] &&
        (layout['xaxis.range[0]'] !== this.timeSteps.min ||
        layout['xaxis.range[1]'] !== this.timeSteps.max)
      ){
        let timeSteps = {
          ...this.timeSteps
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
