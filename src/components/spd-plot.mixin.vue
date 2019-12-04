<script>
import _debounce from 'lodash/debounce'
import _defaultsDeep from 'lodash/defaultsDeep'
import VuePlotly from '@statnett/vue-plotly'
import colors from '@/lib/flat-ui-colors'

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
            , activecolor: colors.yellow
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
    , onRelayout(){
      let layout = this.$refs.plot.layout
      let xRange = layout.xaxis.range.concat()
      let yRange = layout.yaxis.range.concat()

      this.$emit('updatedView', { xRange, yRange })
      this.$emit('relayout', layout)
    }
  }
}
</script>

<style lang="sass">
.spd-plot
  background: map-get($flat-ui, 'wet-asphalt')
  padding-top: 27px
  .sub-bar
    width: 45%
  .js-plotly-plot .plotly .modebar
    top: -27px
    right: 14px
    z-index: 4
  .progress
    margin: auto
</style>
