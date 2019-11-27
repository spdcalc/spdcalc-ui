<template lang="pug">
v-responsive.spd-plot(ref="plotWrap", :aspect-ratio="1")
  v-system-bar.sub-bar(dark, color="blue-grey darken-2", absolute)
    slot(name="chart-bar")
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
import colors from 'vuetify/lib/util/colors'

export default {
  name: 'SPDLinePlot'
  , mixins: [SPDPlotMixin]
  , props: {
    y2Title: {
      type: String
    }
    , xData: {}
    , yData: {}
  }
  , computed: {
    config(){
      let layout = {
        margin: {
          r: 70
        }
        , legend: {
          showlegend: true
          , xanchor: 'center'
          , yanchor: 'bottom'
          , x: 0.5
          , y: 1
          , orientation: 'h'
        }
        , xaxis: {
          title: this.xTitle
          , showgrid: false
          , zeroline: false
          , ticklen: 10
          , ticks: 'inside'
          , rangemode: 'tozero'
        }
        , yaxis: {
          title: this.yTitle
          , showgrid: false
          , ticklen: 10
          , ticks: 'inside'
          , zeroline: false
          // , showline: true
          // , automargin: true
        }
      }

      if ( this.y2Title ){
        layout.yaxis2 = {
          title: this.y2Title
          , showgrid: false
          , ticklen: 10
          , ticks: 'inside'
          , overlaying: 'y'
          , side: 'right'
        }
      }

      return {
        layout
      }
    }
    , data(){
      if ( this.chartData ){
        return this.chartData
      }

      return this.yData ? [{
        x: this.xData
        , y: this.yData
        , type: 'scatter'
        , mode: 'lines'
        , line: {
          shape: 'spline'
          , color: colors.blueGrey.darken2
        }
        , spline: {
          color: colors.blueGrey.darken2
        }
        , marker: {
          color: colors.blueGrey.darken2
        }
      }] : []
    }
  }
}
</script>

<style lang="sass" scoped>
</style>
