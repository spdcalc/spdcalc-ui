<template lang="pug">
.jsa
  h2 Test JSA Calc page
  v-layout(row, wrap)
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
import worker from 'workerize-loader!@/workers/test'

import * as Comlink from 'comlink'
import clworker from 'worker-loader!@/workers/comlink'

const mod = Comlink.wrap( new clworker() )

const instance = worker()

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
      default: 2000
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
      }
      , options: {}
      , autoResize: true
    }
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
      mod.getGaussian(this.gridSize, this.gridSize).then( res => {
        let result = res
        this.chart.data = [{
          z: createGroupedArray(result, this.gridSize)
          , type: 'heatmapgl'
          , colorscale: 'Greys'
        }]
        this.endTimer()
        this.loading = false
      })
    }
    , getFromJS(){
      this.startTimer()
      this.loading = true
      mod.getGaussianJS(this.gridSize, this.gridSize).then( res => {
        let result = res
        this.chart.data = [{
          z: createGroupedArray(result, this.gridSize)
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
