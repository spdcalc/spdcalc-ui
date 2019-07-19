<template lang="pug">
.jsa
  v-container(fluid, grid-list-lg)
    v-layout(row, wrap)
      v-flex(xs12)
        h2 JSI

      v-flex(xs6)
        v-card
          v-card-text(v-if="elapsed") Took: {{ elapsed }}
          v-btn(
            @click="redraw"
            , :loading="loading"
          ) Refresh
          vue-plotly(v-bind="chart", v-if="chart.data.length")
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
      return _times( divisions + 1, (n) => {
        let val = n / divisions
        return [val, colorScale(val).css('rgb')]
      })
    }
    , chart(){
      return {
        data: this.chartData

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
        , options: {}
        , autoResize: true
      }
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'jsiConfig'
    ])
  }
  , mounted(){
    this.$store.watch(
      (state, getters) => ({ ...getters['parameters/spdConfig'], ...getters['parameters/jsiConfig'] })
      , () => this.redraw()
      , { immediate: true, deep: true }
    )
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

      spdcalc.getJSI( this.spdConfig, this.jsiConfig ).then( res => {
        let result = res
        let jsi = this.jsiConfig
        let x0 = jsi.ls_min
        let dx = (jsi.ls_max - x0) / (jsi.size - 1)
        let y0 = jsi.li_min
        let dy = (jsi.li_max - y0) / (jsi.size - 1)
        // console.log(res)
        this.chartData = [{
          x0
          , dx
          , y0
          , dy
          , z: createGroupedArray(result, this.jsiConfig.size)
          , type: 'heatmapgl'
          , colorscale: this.colorScaleArray
        }]
        this.endTimer()
        this.loading = false
      })
    }, 100)
  }
}
</script>
