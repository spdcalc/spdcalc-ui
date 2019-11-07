<template lang="pug">
v-responsive.histogram(ref="plotWrap", :aspect-ratio="1")
  vue-plotly(
    v-if="chart.data.length"
    , ref="plot"
    , v-bind="chart"
    , @relayout="$emit('relayout', $event)")
  v-container(v-else, fill-height)
    v-layout(align-center, justify-center, fill-height)
      v-progress-circular(indeterminate, color="blue-grey", size="70")
</template>

<script>
import d3 from 'd3'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import VuePlotly from '@statnett/vue-plotly'
import chroma from 'chroma-js'

export default {
  name: 'Histogram'
  , props: {
    minColor: {
      type: String
      , default: 'white'
    }
    , maxColor: {
      type: String
      , default: '#34495e'
    }
    , chartData: {
      type: Array
      , default: () => []
    }
    , axes: {
      type: Object
      , required: true
    }
    , usegl: {
      type: Boolean
      , default: true
    }
    , xTitle: {
      type: String
    }
    , yTitle: {
      type: String
    }
    , logScale: {
      type: Boolean
    }
    , logMin: {
      type: Number
      , default: 0.01
    }
  }
  , data: () => ({
    loading: false
    , dimension: 500
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
        if ( this.logScale ){
          zVal = n === 0 ? 0 : this.scaleLog.invert(val)
        }
        return [zVal, colorScale(val).css('rgb')]
      })
    }
    , colorbar(){
      let colorbar = {
        ticks: 'inside'
        , thickness: 20
        , tickformat: '.2f'
        , xpad: 0
        , ypad: 0
      }

      if ( this.logScale ){
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

      return colorbar
    }
    , chart(){
      let dim = this.dimension

      let { x0, dx, y0, dy } = this.axes

      let data = this.chartData && this.chartData.length ? [{
        x0
        , dx
        , y0
        , dy
        , z: this.chartData
        , zmin: this.logScale ? 0.01 : 0
        , zmax: 1
        , type: this.usegl ? 'heatmapgl' : 'heatmap'
        , colorscale: this.colorScaleArray
        , colorbar: this.colorbar
        , showscale: false
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
          , margin: {
            t: 38
            , r: 18
            , l: 70
            , b: 50
            , pad: 0
          }
          , width: dim
          , height: dim
          , xaxis: {
            title: this.xTitle
            , showgrid: false
          }
          , yaxis: {
            title: this.yTitle
            , showgrid: false
          }
        }
        , autoResize: true
      }
    }
  }
  , mounted(){
    const resize = _debounce(() => {
      this.dimension = this.getSize()
      this.$emit('resize', this.dimension)
    }, 200)

    window.addEventListener('resize', resize, { passive: true })
    this.dimension = this.getSize()

    this.$on('hook:beforeDestroy', () => {
      window.removeEventListener('resize', resize)
    })
  }
  , methods: {
    getSize(){
      return this.$refs.plotWrap ?
        this.$refs.plotWrap.$el.offsetWidth :
        500
    }
  }
}
</script>

<style lang="sass">
.histogram
  .js-plotly-plot .plotly .modebar
    top: 14px
    right: 14px
</style>
