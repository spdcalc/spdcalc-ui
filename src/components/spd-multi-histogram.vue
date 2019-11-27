<template lang="pug">
v-responsive.spd-plot(ref="plotWrap", :aspect-ratio="1")
  v-system-bar.sub-bar(dark, color="blue-grey darken-2", absolute)
    slot(name="chart-bar")
  .color-scales
    .color-scale(
      v-for="entry in chartData"
      , @click="toggleHide(entry)"
      , :class="{ hidden: !isVisible(entry) }"
    )
      ColorScale(
        :color-scale="entry.scale"
        , :scale="logScale ? scaleLog : undefined"
        , :title="entry.name"
      )
  vue-plotly(
    v-if="chart.data.length"
    , ref="plot"
    , v-bind="chart"
    , @relayout="onRelayout"
  )
  v-container(v-else, fill-height)
    v-layout(align-center, justify-center, fill-height)
      v-progress-circular.progress(indeterminate, color="blue-grey", size="70")
</template>

<script>
import SPDPlotMixin from '@/components/spd-plot.mixin'
import ColorScale from '@/components/color-scale'
import d3 from 'd3'
import _times from 'lodash/times'

export default {
  name: 'SPDMultiHistogram'
  , mixins: [SPDPlotMixin]
  , props: {
    axes: {
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
  , data: () => ({
    hiddenTraces: []
  })
  , computed: {
    scaleLog(){
      return d3.scale.log()
        .domain([this.logMin, 1])
        .range([0, 1])
    }
    , logMinPow(){
      return Math.log10(this.logMin)
    }
    , data(){
      let { x0, dx, y0, dy } = this.axes

      // expect chartData = [{ data: [z, z,...], scale: <clorscale> }, ...]
      let data = this.chartData && this.chartData.map( entry => ({
        x0
        , dx
        , y0
        , dy
        , z: entry.data
        , name: entry.name
        , zmin: this.logScale ? 0.01 : 0
        , zmax: 1
        , type: this.usegl ? 'heatmapgl' : 'heatmap'
        , visible: this.isVisible(entry)
        , colorscale: this.getColorScaleArray(entry.scale)
        , showscale: false
      }))

      return data
    }
  }
  , methods: {
    getColorScaleArray(colorScale){
      const divisions = 100
      return _times( divisions, (n) => {
        let val = n / (divisions - 1)
        let zVal = val
        if ( this.logScale ){
          zVal = n === 0 ? 0 : this.scaleLog.invert(val)
        }
        return [zVal, colorScale(val).css('rgba')]
      })
    }
    , isVisible(trace){
      return !this.hiddenTraces.includes(trace)
    }
    , toggleHide(trace){
      if ( this.isVisible(trace) ){
        this.hiddenTraces.push(trace)
      } else {
        let idx = this.hiddenTraces.indexOf(trace)
        this.hiddenTraces.splice(idx, 1)
      }
    }
  }
}
</script>

<style lang="sass" scoped>
.color-scales
  position: absolute
  top: 27px + 8px
  right: 0
  left: 0
  z-index: 10
  display: flex
  justify-content: space-evenly
  background: white
  .color-scale
    cursor: pointer
    user-select: none
    &.hidden
      opacity: 0.5
</style>
