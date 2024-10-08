<template lang="pug">
.spd-plot
  v-system-bar.sub-bar(v-if="showSubBar", dark, color="panel", :height="28")
    slot(name="chart-bar")
  v-responsive(ref="plotWrap", :aspect-ratio="aspectRatio")
    .color-scale
      ColorScale(:color-scale="colorScale", :scale="logScale ? scaleLog : scale")
    Plotly(
      v-if="chart.data.length"
      , ref="plot"
      , :data="chart.data"
      , :layout="chart.layout"
      , v-bind="chart.options"
      , @relayout="onRelayout"
    )
    v-container(v-else, fill-height)
      v-layout(align-center, justify-center, fill-height)
        v-progress-circular.progress(indeterminate, color="loading", size="70")
</template>

<script>
import SPDPlotMixin from '@/components/spd-plot.mixin.vue'
import ColorScale from '@/components/color-scale.vue'
import { scaleLinear, scaleLog } from 'd3-scale'
import _times from 'lodash/times'
import spdColors from '@/spd-colors'
import chroma from 'chroma-js'
import lerp from '@/lib/lerp'

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
    , isAngle: {
      type: Boolean
    }
    , highlightZero: {
      type: Boolean
      , default: false
    }
    , zeroCutoff: {
      type: Number
      , default: 1e-6
    }
    , zrange: {
      type: Array,
      default: () => [0, 1]
    }
  }
  , components: {
    ColorScale
  }
  , computed: {
    config(){
      let layout = {}
      if (this.chartData.length <= 20) {
        let { x0, dx, y0, dy } = this.axes
        layout.xaxis = {
          tickmode: 'array',
          tickvals: Array.from({ length: this.chartData.length }, (v, i) => (x0 + i * dx).toFixed(1))
        }
        layout.yaxis = {
          tickmode: 'array',
          tickvals: Array.from({ length: this.chartData.length }, (v, i) => (y0 + i * dy).toFixed(1))
        }
      }
      return {
        layout
      }
    },
    colorScale(){
      const isAngle = this.isAngle
      const highlightZero = this.highlightZero
      const zrange = this.zrange
      if (isAngle) {
        return chroma.scale(spdColors.phaseColors)
          .domain([0, 0.5, 1])
          .mode('lab')
      }
      if (highlightZero && zrange[0] === 0) {
        return chroma.scale([
          spdColors.zeroColor
          , this.minColor
          , this.maxColor
        ]).domain([
          0,
          this.zeroCutoff,
          1
        ]).mode('lab')
      }
      return chroma.scale([
        this.minColor
        , this.maxColor
      ]).domain([0, 1]).mode('lab')
    }
    , logMin(){
      return this.zrange[0] === 0 ? 0.01 : this.zrange[0]
    }
    , scale(){
      return scaleLinear()
        .domain(this.isAngle ? [-Math.PI, Math.PI] : this.zrange)
        .range([0, 1])
    }
    , scaleLog(){
      return scaleLog()
        .domain([this.logMin, this.zrange[1]])
        .range([0, 1])
    }
    , logMinPow(){
      return Math.log10(this.logMin)
    }
    , colorScaleArray(){
      const colorScale = this.colorScale
      const divisions = 100
      const log = scaleLog().domain([this.logMin, 1])
      const [min, max] = this.colorScale.domain()
      return _times( divisions, (n) => {
        let k = n / (divisions - 1)
        let x = lerp(min, max, k)
        if ( this.logScale ){
          k = n === 0 ? 0 : log.invert(k)
        }
        // the color scale works with fractions of colors
        // ... not z values.
        return [k, colorScale(x).css('rgb')]
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
      let [zmin, zmax] = this.logScale ? this.scaleLog.domain() : this.scale.domain()

      let data = this.chartData && this.chartData.length ? [{
        x0
        , dx
        , y0
        , dy
        , z: this.chartData
        , zmin: zmin
        , zmax: zmax
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
