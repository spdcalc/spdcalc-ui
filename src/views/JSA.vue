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

      v-flex(xs6)
        v-card
          v-card-title(primary-title) Indices
          v-card-text
            v-select(:items="crystals", label="Crystal", v-model="crystal")
            v-text-field(label="Wavelength nm", type="number", min="0", v-model="wavelength")
            v-text-field(label="Temperature K", type="number", min="0", v-model="temperature")
            v-btn(@click="getIndices") Submit
            pre {{ JSON.stringify(indices, null, 2) }}
</template>

<script>
import VuePlotly from '@statnett/vue-plotly'
import worker from '@/workers/test'

// import * as Comlink from 'comlink'
// import clworker from 'worker-loader!@/workers/comlink'
//
// const mod = Comlink.wrap( clworker() )

const mod = worker()

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
      default: 100
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
      mod.getGaussian(this.gridSize, this.gridSize).then( res => {
        let result = res
        console.log(res)
        this.chart.data = [{
          z: createGroupedArray(result, this.gridSize)
          , type: 'heatmap'
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
    , getIndices(){
      mod.getIndices(this.crystal, this.wavelength * 1e-9, this.temperature).then( res => {
        this.indices = res
      })
    }
  }
}
</script>
