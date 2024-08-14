<template lang="pug">
.spd-plot
  v-system-bar.sub-bar(v-if="showSubBar", dark, color="panel", :height="28")
    slot(name="chart-bar")
  v-responsive(ref="plotWrap", :aspect-ratio="aspectRatio")
    .color-scales
      .color-scale(
        v-for="entry in chartData"
        , @click="toggleHide(entry)"
        , :class="{ hidden: !isVisible(entry) }"
      )
        ColorScale(
          :color-scale="entry.scale"
          , :scale="logScale ? scaleLog : scaleLinear"
          , :title="entry.name"
        )
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
import { scaleLog, scaleLinear } from 'd3-scale'
import _times from 'lodash/times'
import _find from 'lodash/find'
import _map from 'lodash/map'

function getPrecision(val = 1) {
  return Math.max(2, val.toPrecision(1).length - 2)
}

export default {
  name: 'SPDMultiHistogram',
  mixins: [SPDPlotMixin],
  props: {
    axes: {
      type: Object,
      required: true,
    },
    usegl: {
      type: Boolean,
      default: true,
    },
    logScale: {
      type: Boolean,
    },
    logMin: {
      type: Number,
      default: 0.01,
    },
  },
  components: {
    ColorScale,
  },
  data: () => ({
    hiddenTraces: [],
    scaleLinear: scaleLinear(),
  }),
  computed: {
    scaleLog() {
      return scaleLog().domain([this.logMin, 1]).range([0, 1])
    },
    logMinPow() {
      return Math.log10(this.logMin)
    },
    data() {
      let { x0, dx, y0, dy } = this.axes

      // expect chartData = [{ data: [z, z,...], scale: <clorscale> }, ...]
      let data =
        this.chartData &&
        this.chartData
          .filter((entry) => this.isVisible(entry))
          .map((entry) => ({
            x0,
            dx,
            y0,
            dy,
            z: entry.data,
            name: entry.name,
            zmin: this.logScale ? 0.01 : 0,
            zmax: 1,
            type: this.usegl ? 'heatmapgl' : 'heatmap',
            hoverinfo: 'skip',
            colorscale: this.getColorScaleArray(entry.scale),
            showscale: false,
          }))

      let firstVisible = _find(data, { visible: true })

      if (firstVisible) {
        let precision = getPrecision(dx)
        firstVisible.text = _map(firstVisible.z, (row, j) => {
          return _map(row, (col, i) => {
            let text = data.map((d) => {
              let c = d.colorscale[d.colorscale.length - 1][1]
              return (
                `<span style="color: ${c}">` +
                d.name +
                ': ' +
                d.z[j][i].toFixed(6) +
                '</span>'
              )
            })
            let x = i * dx + x0
            let y = j * dy + y0
            text.unshift(`(${x.toFixed(precision)}, ${y.toFixed(precision)})`)
            return text.join('\n<br>')
          })
        })
        firstVisible.hoverinfo = 'text'
      }

      return data
    },
  },
  methods: {
    getColorScaleArray(colorScale) {
      const divisions = 100
      return _times(divisions, (n) => {
        let val = n / (divisions - 1)
        let zVal = val
        if (this.logScale) {
          zVal = n === 0 ? 0 : this.scaleLog.invert(val)
        }
        return [zVal, colorScale(val).css('rgba')]
      })
    },
    isVisible(trace) {
      return !this.hiddenTraces.includes(trace)
    },
    toggleHide(trace) {
      if (this.isVisible(trace)) {
        this.hiddenTraces.push(trace)
      } else {
        let idx = this.hiddenTraces.indexOf(trace)
        this.hiddenTraces.splice(idx, 1)
      }
    },
  },
}
</script>

<style lang="sass" scoped>
.color-scales
  position: absolute
  top: 8px
  right: 0
  left: 4em
  z-index: 1
  display: flex
  margin: 0 2px
  justify-content: space-evenly
  background: rgba(255, 255, 255, 0.7)
  .color-scale
    margin: 0 8px
    cursor: pointer
    user-select: none
    &.hidden
      opacity: 0.5
</style>
