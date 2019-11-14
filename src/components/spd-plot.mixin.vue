<template lang="pug">
v-responsive.spd-plot(ref="plotWrap", :aspect-ratio="1")
  v-system-bar.sub-bar(dark, color="blue-grey darken-2", absolute)
    slot(name="chart-bar")
  vue-plotly(
    v-if="chart.data.length"
    , ref="plot"
    , v-bind="chart"
    , @relayout="onRelayout")
  v-container(v-else, fill-height)
    v-layout(align-center, justify-center, fill-height)
      v-progress-circular(indeterminate, color="blue-grey", size="70")
</template>

<script>
import _debounce from 'lodash/debounce'
import _defaultsDeep from 'lodash/defaultsDeep'
import VuePlotly from '@statnett/vue-plotly'
import colors from 'vuetify/lib/util/colors'

export default {
  props: {
    chartData: {
      type: Array
    }
    , xTitle: {
      type: String
    }
    , yTitle: {
      type: String
    }
    , plotlyConfig: {
      type: Object
      , default: () => ({})
    }
  }
  , data: () => ({
    dimension: 500
    , xRange: []
    , yRange: []
  })
  , components: {
    VuePlotly
  }
  , computed: {
    // will be overriden
    data(){ return this.chartData || [] }
    // will be overriden
    , config: () => ({})
    , chart(){
      return {
        ..._defaultsDeep(
          {}
          , this.plotlyConfig
          , this.config
          , this.defaultPlotlyConfig
        )
        , data: this.data
      }
    }
    , defaultPlotlyConfig(){
      let dim = this.dimension
      return {
        data: this.chartData && this.chartData.length ? this.chartData : []
        , options: {
          responsive: true
          , displaylogo: false
          // , showLink: true
          , displayModeBar: true
          // , modeBarButtons: [['zoom2d', 'pan2d']]
        }
        , layout: {
          modebar: {
            bgcolor: 'transparent'
            , color: 'white'
            , activecolor: colors.yellow.base
          }
          , hoverlabel: {
            bgcolor: 'white'
            , bordercolor: '#34495e'
            , font: {
              color: '#34495e'
            }
          }
          , margin: {
            t: 18
            , r: 18
            , l: 70
            , b: 70
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
      return this.$refs.plotWrap
        ? this.$refs.plotWrap.$el.offsetWidth
        : 500
    }
    , onRelayout(layout){
      let xRange = this.xRange
      let yRange = this.yRange

      // this might be the dumbest thing about plotly
      let layoutX = layout['xaxis.range']
        ? layout['xaxis.range']
        : Number.isFinite(layout['xaxis.range[0]']) &&
          [layout['xaxis.range[0]'], layout['xaxis.range[1]']]
      let layoutY = layout['yaxis.range']
        ? layout['yaxis.range']
        : Number.isFinite(layout['yaxis.range[0]']) &&
          [layout['yaxis.range[0]'], layout['yaxis.range[1]']]

      let xchanged = layoutX &&
        (layoutX[0] !== xRange[0] ||
        layoutX[1] !== xRange[1])

      let ychanged = layoutY &&
        (layoutY[0] !== yRange[0] ||
        layoutY[1] !== yRange[1])

      if ( !xchanged && !ychanged ){ return }

      if (xchanged){
        this.xRange = [].concat(layoutX)
      }

      if (ychanged){
        this.yRange = [].concat(layoutY)
      }

      console.log(this.xRange, this.yRange)
      this.$emit('updatedView', { xRange: this.xRange, yRange: this.yRange })
      this.$emit('relayout', layout)
    }
  }
}
</script>

<style lang="sass">
.spd-plot
  background: map-get($blue-grey, 'darken-2')
  padding-top: 27px
  .sub-bar
    width: 50%
  .js-plotly-plot .plotly .modebar
    top: -27px
    right: 14px
    z-index: 4
</style>
