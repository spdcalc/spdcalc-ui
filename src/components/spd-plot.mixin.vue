<script>
import _debounce from 'lodash/debounce'
import _defaultsDeep from 'lodash/defaultsDeep'
import { Plotly } from '@wellcaffeinated/vue-plotly'
import colors from '@/lib/flat-ui-colors'
import { saveAs } from 'file-saver'

function getDataVals(data) {
  if (data.z === undefined) {
    return {
      xvals: Array.from(data.x),
      yvals: Array.from(data.y),
    }
  }
  const { x0, y0, dx, dy } = data
  const ysize = data.z.length | 0
  const xsize = data.z[0]?.length | 0
  const yvals = Array.from({ length: ysize }, (_, i) => i * dy + y0)
  const xvals = Array.from({ length: xsize }, (_, i) => i * dx + x0)
  const zvals = data.z.map((row) => Array.from(row))
  return {
    xvals,
    yvals,
    zvals,
  }
}

function isTouchEnabled() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

export default {
  props: {
    chartData: {
      type: Array,
    },
    xTitle: {
      type: String,
    },
    yTitle: {
      type: String,
    },
    plotlyConfig: {
      type: Object,
      default: () => ({}),
    },
    aspectRatio: {
      type: Number,
      default: 1,
    },
    showSubBar: {
      type: Boolean,
      default: true,
    },
  },
  data: () => ({
    dimensions: [500, 500],
    xRange: [],
    yRange: [],
    legendVisibility: [],
  }),
  components: {
    Plotly,
  },
  computed: {
    // will be overriden
    data() {
      return this.chartData || []
    },
    // will be overriden
    config: () => ({}),
    chart() {
      return {
        ..._defaultsDeep(
          {},
          this.plotlyConfig,
          this.config,
          this.defaultPlotlyConfig
        ),
        data: this.data.map((d, i) => {
          return {
            visible: this.legendVisibility[i] || true,
            ...d,
          }
        }),
      }
    },
    defaultPlotlyConfig() {
      let [width, height] = this.dimensions
      return {
        data: this.chartData && this.chartData.length ? this.chartData : [],
        options: {
          responsive: true,
          displaylogo: false,
          // , showLink: true
          // , scrollZoom: false
          displayModeBar: this.showSubBar,
          toImageButtonOptions: {
            format: 'png', // one of png, svg, jpeg, webp
            filename: `plot-${new Date().toISOString()}`,
            height: 2000,
            width: 2000,
            scale: 1, // Multiply title/legend/axis/canvas sizes by this factor
          },
          // , modeBarButtons: [['zoom2d', 'pan2d']]
          modeBarButtonsToAdd: [
            'hovercompare',
            // TODO: make this download button more robust
            {
              name: 'downloadData',
              title: 'Download data',
              icon: {
                width: 857.1,
                height: 1000,
                path: 'm214-7h429v214h-429v-214z m500 0h72v500q0 8-6 21t-11 20l-157 156q-5 6-19 12t-22 5v-232q0-22-15-38t-38-16h-322q-22 0-37 16t-16 38v232h-72v-714h72v232q0 22 16 38t37 16h465q22 0 38-16t15-38v-232z m-214 518v178q0 8-5 13t-13 5h-107q-7 0-13-5t-5-13v-178q0-8 5-13t13-5h107q7 0 13 5t5 13z m357-18v-518q0-22-15-38t-38-16h-750q-23 0-38 16t-16 38v750q0 22 16 38t38 16h517q23 0 50-12t42-26l156-157q16-15 27-42t11-49z',
                transform: 'matrix(1 0 0 -1 0 850)',
              },
              click: (gd) => {
                this.downloadData(gd)
              },
            },
          ],
        },
        layout: {
          modebar: {
            bgcolor: 'transparent',
            color: 'white',
            activecolor: colors.yellow,
          },
          dragmode: isTouchEnabled() ? false : 'zoom',
          hovermode: 'x',
          hoverlabel: {
            bgcolor: 'white',
            bordercolor: colors.midnightBlue,
            font: {
              color: colors.midnightBlue,
            },
          },
          margin: {
            t: 18,
            r: 18,
            l: 70,
            b: 70,
            pad: 0,
          },
          width,
          height,
          xaxis: {
            title: this.xTitle,
            showgrid: false,
            showline: true,
          },
          yaxis: {
            title: this.yTitle,
            showgrid: false,
            showline: true,
          },
        },
        autoResize: true,
      }
    },
  },
  mounted() {
    const resize = _debounce(() => {
      this.dimensions = this.getSize()
      this.$emit('resize', this.dimensions)
    }, 200)

    window.addEventListener('resize', resize, { passive: true })
    this.dimensions = this.getSize()

    this.$on('hook:beforeDestroy', () => {
      window.removeEventListener('resize', resize)
    })
  },
  methods: {
    downloadData(gd) {
      // const csv = gd.data[0].z ? getHeatmapDataCsv(gd) : getSeriesDataCsv(gd)
      const plots = gd.data.map((data) => {
        const vals = getDataVals(data)
        return {
          name: data.name,
          ...vals,
        }
      })
      const json = {
        ylabel: gd.layout.yaxis?.title?.text,
        xlabel: gd.layout.xaxis?.title?.text,
        url: window.location.href,
        plots,
      }
      let blob = new Blob([JSON.stringify(json, null, 2)], {
        type: 'text/json',
      })
      saveAs(blob, 'export.json')
    },
    getSize() {
      let w = this.$refs.plotWrap ? this.$refs.plotWrap.$el.offsetWidth : 500
      return [w, w / this.aspectRatio]
    },
    onRelayout(e) {
      let layout = this.$refs.plot.layout
      let xRange = layout.xaxis.range.concat()
      let yRange = layout.yaxis.range.concat()

      this.$emit('updatedView', { xRange, yRange })
      this.$emit('relayout', layout)
    },
    onRestyle(e) {
      let [changed, traces] = e
      if (changed && changed.visible && traces) {
        let arr = this.legendVisibility.concat([])
        traces.forEach((i) => {
          arr[i] = changed.visible[0]
        })
        this.legendVisibility = arr
      }

      this.$emit('restyle', e)
      this.$emit('change:legendVisibility', this.legendVisibility)
    },
  },
}
</script>

<style lang="sass">
.spd-plot
  background: $color-panel-dark
  .v-responsive
    overflow: visible
  .sub-bar
    max-width: 35%
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
