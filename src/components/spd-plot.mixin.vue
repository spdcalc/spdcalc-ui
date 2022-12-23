<script>
import _debounce from 'lodash/debounce'
import _defaultsDeep from 'lodash/defaultsDeep'
import { Plotly } from '@wellcaffeinated/vue-plotly'
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
    , aspectRatio: {
      type: Number
      , default: 1
    }
    , showSubBar: {
      type: Boolean
      , default: true
    }
  }
  , data: () => ({
    dimensions: [500, 500]
    , xRange: []
    , yRange: []
    , legendVisibility: []
  })
  , components: {
    Plotly
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
        , data: this.data.map((d, i) => {
          return {
            visible: this.legendVisibility[i] || true
            , ...d
          }
        })
      }
    }
    , defaultPlotlyConfig(){
      let [width, height] = this.dimensions
      return {
        data: this.chartData && this.chartData.length ? this.chartData : []
        , options: {
          responsive: true
          , displaylogo: false
          // , showLink: true
          , displayModeBar: this.showSubBar
          // , modeBarButtons: [['zoom2d', 'pan2d']]
          , modeBarButtonsToAdd: ['hovercompare']
        }
        , layout: {
          modebar: {
            bgcolor: 'transparent'
            , color: 'white'
            , activecolor: colors.yellow
          }
          , hovermode: 'x'
          , hoverlabel: {
            bgcolor: 'white'
            , bordercolor: colors.midnightBlue
            , font: {
              color: colors.midnightBlue
            }
          }
          , margin: {
            t: 18
            , r: 18
            , l: 70
            , b: 70
            , pad: 0
          }
          , width
          , height
          , xaxis: {
            title: this.xTitle
            , showgrid: false
            , showline: true
          }
          , yaxis: {
            title: this.yTitle
            , showgrid: false
            , showline: true
          }
        }
        , autoResize: true
      }
    }
  }
  , mounted(){
    const resize = _debounce(() => {
      this.dimensions = this.getSize()
      this.$emit('resize', this.dimensions)
    }, 200)

    window.addEventListener('resize', resize, { passive: true })
    this.dimensions = this.getSize()

    this.$on('hook:beforeDestroy', () => {
      window.removeEventListener('resize', resize)
    })
  }
  , methods: {
    getSize(){
      let w = this.$refs.plotWrap
        ? this.$refs.plotWrap.$el.offsetWidth
        : 500
      return [w, w / this.aspectRatio]
    }
    , onRelayout(e){
      let layout = this.$refs.plot.layout
      let xRange = layout.xaxis.range.concat()
      let yRange = layout.yaxis.range.concat()

      this.$emit('updatedView', { xRange, yRange })
      this.$emit('relayout', layout)
    }
    , onRestyle(e){
      let [changed, traces] = e
      if (changed && changed.visible && traces){
        let arr = this.legendVisibility.concat([])
        traces.forEach(i => {
          arr[i] = changed.visible[0]
        })
        this.legendVisibility = arr
      }

      this.$emit('restyle', e)
      this.$emit('change:legendVisibility', this.legendVisibility)
    }
  }
}
</script>

<style lang="sass">
.spd-plot
  background: $color-panel-dark
  .v-responsive
    overflow: visible
  .sub-bar
    width: 45%
  .js-plotly-plot .plotly .modebar
    top: -27px
    right: 14px
    z-index: 4
    [data-title]::after
      background-color: $color-tooltips
    [data-title]::before
      border-color: transparent transparent $color-tooltips
  .progress
    margin: auto
</style>
