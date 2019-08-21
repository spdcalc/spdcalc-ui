<template lang="pug">
v-card.hom-series
  v-toolbar(flat, dark, color="blue-grey darken-2")
    v-toolbar-title Hong-Ou-Mandel Time Series
    v-spacer
    v-btn(
      @click="redraw"
      , :loading="loading"
      , icon
    )
      v-icon mdi-refresh
    v-toolbar-items

    v-btn(
      icon
      , color="red lighten-1"
      , @click="$emit('remove')"
    )
      v-icon mdi-close
  v-responsive(ref="plotWrap", :aspect-ratio="1")
    v-text-field.ctrl(v-model="timeSteps.steps", type="number", step="1", label="steps")
    vue-plotly(ref="plot", v-if="chartData.length", v-bind="chart", :data="chartData", @relayout="onRelayout")
    v-container(v-else, fill-height)
      v-row(align="center", justify="center", fill-height)
        v-col(cols="1")
          v-progress-circular(indeterminate, color="blue-grey", size="70")
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import d3 from 'd3'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import _mapValues from 'lodash/mapValues'
import VuePlotly from '@statnett/vue-plotly'
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
    VuePlotly
  }
  , computed: {
    chart(){
      // hack for resize
      this.resizeCount // eslint-disable-line no-unused-expressions
      let dim = this.$refs.plotWrap ? this.$refs.plotWrap.$el.offsetWidth : 500

      return {
        options: {
          responsive: true
          , displaylogo: false
          // , showLink: true
          , displayModeBar: true
          // , modeBarButtons: [['zoom2d', 'pan2d']]
        }
        , layout: {
          margin: {
            t: 80
          }
          , width: dim
          , height: dim
          , xaxis: {
            title: 'Time Delay (fs)'
            , showgrid: false
          }
          , yaxis: {
            title: 'Coincidence Rate'
            , showgrid: false
          }
        }
        , autoResize: true
      }
    }
    , chartData(){
      return this.data ? [{
        x: this.xAxisData
        , y: this.data
        , type: 'scatter'
        , mode: 'lines'
        , line: { shape: 'spline' }
      }] : []
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
  }
  , created(){
    this.calculate = _debounce(this.calculate.bind(this), 500)
  }
  , mounted(){

    const resize = _debounce(() => {
      this.resizeCount++
    }, 200)

    window.addEventListener('resize', resize, { passive: true })

    const unwatch = this.$store.watch(
      (state, getters) => getters['parameters/isReady'] &&
        !getters['parameters/isEditing'] &&
        ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , ( refresh ) => refresh && this.redraw()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
      window.removeEventListener('resize', resize)
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
.hom-series
  .ctrl
    position: absolute
    top: 1em
    left: 1em
    z-index: 2
  .switch
    padding: 20px 8px
  .js-plotly-plot .plotly .modebar
    top: 22px
    right: 22px
</style>
