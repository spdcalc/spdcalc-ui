<template lang="pug">
.jsa
  v-container(fluid, grid-list-lg)
    v-layout(row, wrap)
      v-flex(xs12)
        h2 Test JSA Calc page

      v-flex(xs6)
        v-card
          v-card-text Draw Gaussian
            p(v-if="elapsed") Took: {{ elapsed }}
          v-btn(
            @click="redraw"
            , :loading="loading"
          ) Refresh
          vue-plotly(v-bind="chart", v-if="chart.data.length")
</template>

<script>
import { mapGetters } from 'vuex'
import _debounce from 'lodash/debounce'
import VuePlotly from '@statnett/vue-plotly'
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
    gridSize: {
      default: 1000
    }
  }
  , data: () => ({
    tests: {}
    , loading: false
    , elapsed: ''
    , chart: {
      data: []
      , layout: {
        width: 500
        , height: 500
        , xaxis: {
          showgrid: false
        }
        , yaxis: {
          showgrid: false
        }
      }
      , options: {}
      , autoResize: true
    }
    , crystals: [
      'bbo'
      , 'ktp'
      , 'bibo'
      , 'aggas2'
      , 'liio3'
    ]
    , crystal: 'bbo'
    , wavelength: 720
    , temperature: 293
    , indices: []
  })
  , components: {
    VuePlotly
  }
  , computed: {
    ...mapGetters('parameters', [
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
        // console.log(res)
        this.chart.data = [{
          z: createGroupedArray(result, this.jsiConfig.size)
          , type: 'heatmapgl'
          , colorscale: 'Greys'
        }]
        this.endTimer()
        this.loading = false
      })
    }, 100)
  }
}
</script>
