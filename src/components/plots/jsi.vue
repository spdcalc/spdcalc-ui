<template lang="pug">
v-card.jsi
  v-toolbar(flat, dark, color="blue-grey darken-2")
    v-toolbar-title JSI
    v-spacer
    v-btn(
      @click="redraw"
      , :loading="loading"
      , icon
    )
      v-icon mdi-refresh
    v-toolbar-items
      v-switch.pa-5.pr-1(v-model="enableLogScale", label="Log Scale", color="yellow")
    v-btn(
      icon
      , color="red lighten-1"
      , @click="$emit('remove')"
    )
      v-icon mdi-close
  v-responsive(ref="plotWrap", :aspect-ratio="1")
    vue-plotly(ref="plot", v-if="chart.data.length", v-bind="chart")
    v-container(v-else, fill-height)
      v-layout(align-center, justify-center, fill-height)
        v-progress-circular(indeterminate, color="blue-grey", size="70")
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import d3 from 'd3'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import VuePlotly from '@statnett/vue-plotly'
import chroma from 'chroma-js'



export default {
  name: 'jsa'
  , props: {
    minColor: {
      type: String
      , default: 'white'
    }
    , maxColor: {
      type: String
      , default: '#34495e'
    }
  }
  , data: () => ({
    loading: false
    , resizeCount: 0
    , enableLogScale: false
    , logMin: 0.01
  })
  , components: {
    VuePlotly
  }
  , computed: {
    colorScale(){
      return chroma.scale([
        this.minColor
        , this.maxColor
      ]).mode('lab')
    }
    , scaleLog(){
      return d3.scale.log()
        .domain([this.logMin, 1])
        .range([0, 1])
    }
    , logMinPow(){
      return Math.log10(this.logMin)
    }
    , colorScaleArray(){
      const colorScale = this.colorScale
      const divisions = 100
      return _times( divisions, (n) => {
        let val = n / (divisions - 1)
        let zVal = val
        if ( this.enableLogScale ){
          zVal = n === 0 ? 0 : this.scaleLog.invert(val)
        }
        return [zVal, colorScale(val).css('rgb')]
      })
    }
    , chart(){
      // hack for resize
      this.resizeCount // eslint-disable-line no-unused-expressions
      let dim = this.$refs.plotWrap ? this.$refs.plotWrap.$el.offsetWidth : 500

      // console.log(res)
      let integration = this.integrationConfig
      let x0 = integration.ls_min
      let dx = (integration.ls_max - x0) / (integration.size - 1)
      let y0 = integration.li_min
      let dy = (integration.li_max - y0) / (integration.size - 1)

      let colorbar = {
        ticks: 'inside'
        , thickness: 20
        , tickformat: '.2f'
        , xpad: 0
        , ypad: 0
      }

      if ( this.enableLogScale ){
        let numTicks = 3
        let ticktext = _times(numTicks, n => Math.pow(10, n - numTicks + 1 ))

        colorbar = {
          ...colorbar
          , tick0: 0
          , tickmode: 'array'
          , tickvals: ticktext.map( n => this.scaleLog(n) )
          , ticktext: ticktext.map( n => n.toFixed(2) )
        }
      }

      let data = this.chartData ? [{
        x0
        , dx
        , y0
        , dy
        , z: this.chartData
        , type: 'heatmapgl'
        , colorscale: this.colorScaleArray
        , colorbar
      }] : []

      return {
        data
        , options: {
          responsive: true
          , displaylogo: false
          // , showLink: true
          , displayModeBar: true
          // , modeBarButtons: [['zoom2d', 'pan2d']]
        }
        , layout: {
          hoverlabel: {
            bgcolor: 'white'
            , bordercolor: '#34495e'
            , font: {
              color: '#34495e'
            }
          }
          // title: {
          //   text: 'JSI Plot'
          // }
          , margin: {
            t: 80
          }
          , width: dim
          , height: dim
          , xaxis: {
            title: 'Signal wavelength (nm)'
            , showgrid: false
          }
          , yaxis: {
            title: 'Idler wavelength (nm)'
            , showgrid: false
          }
        }
        , autoResize: true
      }
    }
    , chartData(){
      return this.data
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
    , ...mapGetters('plots/jsi', [
      'data'
    ])
  }
  , mounted(){

    const resize = _debounce(() => {
      this.resizeCount++
    }, 200)

    window.addEventListener('resize', resize, { passive: true })

    const unwatch = this.$store.watch(
      (state, getters) => getters['parameters/isReady'] && ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , ( refresh ) => refresh && this.redraw()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
      window.removeEventListener('resize', resize)
    })
  }
  , methods: {
    redraw: function(){
      this.calculate()
    }
    , ...mapActions('plots/jsi', [
      'calculate'
    ])
  }
}
</script>

<style lang="sass">
.jsi
  .js-plotly-plot .plotly .modebar
    top: 22px
    right: 22px
</style>
