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
            @click="getFromWASM"
            , :loading="loading"
          ) Use Wasm
          v-btn(
            @click="getFromJS"
            , :loading="loading"
          ) Use JS
          vue-plotly(v-bind="chart", v-if="chart.data.length")
</template>

<script>
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
    , getFromWASM(){
      this.startTimer()
      this.loading = true
      let props = {
        crystal: 'BBO'
        , signal_wavelength: 1550
        , signal_bandwidth: 1
      }

      let jsiConfig = {
        ls_min: 1500
        , ls_max: 1600
        , li_min: 1500
        , li_max: 1600
        , size: 600
      }

      spdcalc.getJSI( props, jsiConfig ).then( res => {
        let result = res
        // console.log(res)
        this.chart.data = [{
          z: createGroupedArray(result, jsiConfig.size)
          , type: 'heatmapgl'
          , colorscale: 'Greys'
        }]
        this.endTimer()
        this.loading = false
      })
    }
  }
}
</script>
