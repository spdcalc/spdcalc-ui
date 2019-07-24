<template lang="pug">
.jsa
  v-container(fluid, grid-list-lg)
    v-layout(row, wrap)
      v-flex(xs12)
        h2 JSI

      v-flex(sm12, xs12)
        v-card
          v-card-text(v-if="elapsed") Took: {{ elapsed }}
          v-btn(
            @click="redraw"
            , :loading="loading"
          ) Refresh
          vue-plotly(ref="plot", v-if="chart.data.length", v-bind="chart")
</template>

<script>
import { mapGetters } from 'vuex'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import VuePlotly from '@statnett/vue-plotly'
import chroma from 'chroma-js'
import worker from '@/workers/spdcalc'
const spdcalc = worker()

function createGroupedArray(arr, chunkSize) {
  let groups = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize))
  }
  return groups
}

export default {
  name: 'JSA'
  , props: {
    minColor: {
      type: String
      , default: 'navy'
    }
    , maxColor: {
      type: String
      , default: 'gold'
    }
  }
  , data: () => ({
    loading: false
    , elapsed: ''
    , chartData: []
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
    , colorScaleArray(){
      const colorScale = this.colorScale
      const divisions = 100
      return _times( divisions, (n) => {
        let val = n / (divisions - 1)
        return [val, colorScale(val).css('rgb')]
      })
    }
    , chart(){
      return {
        data: this.chartData
        , options: {
          responsive: true
        }
        , layout: {
          hovertemplate: {
            line: {
              color: 'red'
            }
          }
          // title: {
          //   text: 'JSI Plot'
          // }
          // , width: 500
          // , height: 500
          , xaxis: {
            title: 'Signal wavelength (nm)'
            , showgrid: false
          }
          , yaxis: {
            title: 'Idler wavelength (nm)'
            , showgrid: false
          }
        }
        , autoResize: true
      }
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
  }
  , mounted(){

    const unwatch = this.$store.watch(
      (state, getters) => ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , () => this.redraw()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
    })
  }
  , methods: {
    startTimer( name ){
      this._timerStart = window.performance.now()
    }
    , endTimer(){
      let start = this._timerStart
      let end = window.performance.now()
      let duration = end - start
      this.elapsed = duration.toFixed(2) + ' ms'
    }
    , redraw: _debounce(function(){
      this.startTimer()
      this.loading = true

      spdcalc.getJSI( this.spdConfig, this.integrationConfig ).then( res => {
        let result = res
        let integration = this.integrationConfig
        let x0 = integration.ls_min
        let dx = (integration.ls_max - x0) / (integration.size - 1)
        let y0 = integration.li_min
        let dy = (integration.li_max - y0) / (integration.size - 1)
        // console.log(res)
        this.chartData = [{
          x0
          , dx
          , y0
          , dy
          , z: createGroupedArray(result, this.integrationConfig.size)
          , type: 'heatmapgl'
          , colorscale: this.colorScaleArray
        }]
        this.endTimer()
        this.loading = false
      })
    }, 300)
  }
}
</script>
