<template lang="pug">
.spd-plot
  v-system-bar.sub-bar(v-if="showSubBar", dark, color="panel", :height="28")
    slot(name="chart-bar")
  v-responsive(ref="plotWrap", :aspect-ratio="aspectRatio")
    .color-scale
      ColorScale(:color-scale="colorScale", :scale="logScale ? scaleLog : undefined")
    vue-plotly(
      v-if="chart.data.length"
      , ref="plot"
      , v-bind="chart"
      , @relayout="onRelayout"
    )
    v-container(v-else, fill-height)
      v-layout(align-center, justify-center, fill-height)
        v-progress-circular.progress(indeterminate, color="loading", size="70")
</template>

<script>
import SPDPlotMixin from '@/components/spd-plot.mixin.vue'
import ColorScale from '@/components/color-scale.vue'
import d3 from 'd3'
import _times from 'lodash/times'
import spdColors from '@/spd-colors'
import chroma from 'chroma-js'

export default {
  name: 'SPDHistogram'
  , mixins: [SPDPlotMixin]
  , props: {
    minColor: {
      type: String
      , default: 'white'
    }
    , maxColor: {
      type: String
      , default: spdColors.coincColor
    }
    , axes: {
      type: Object
      , required: true
    }
    , usegl: {
      type: Boolean
      , default: true
    }
    , logScale: {
      type: Boolean
    }
    , logMin: {
      type: Number
      , default: 0.01
    }
  }
  , components: {
    ColorScale
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
    , data(){
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

      return data
    }
  }
}
</script>

<style lang="sass" scoped>
.color-scale
  position: absolute
  top: 8px
  right: 8px
  z-index: 1
  pointer-events: none
</style>
