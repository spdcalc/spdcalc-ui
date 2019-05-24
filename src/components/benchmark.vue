<template lang="pug">
  v-container
    v-subheader {{ title }}
    v-layout(text-xs-center, row, wrap)
      v-btn(
        large
        , color="primary"
        , :loading="loading"
        , :disabled="loading"
        , @click="exec"
        ) Run Benchmark
      v-spacer
      vue-plotly(v-bind="chart", v-if="benchmarkDone")
</template>

<script>
import Promise from 'bluebird'
import VuePlotly from '@statnett/vue-plotly'

export default {
  name: 'Benchmark'
  , props: {
    'title': {
      type: String
      , default: 'New Benchmark'
    }
    , 'tests': {
      type: Object
      , required: true
    }
    , 'scaleFactor': {
      type: Number
      , default: 10
    }
    , 'maxScale': {
      type: Number
      , default: 6
    }
    , 'check': {
      type: Boolean
      , default: true
    }
  }
  , components: {
    VuePlotly
  }
  , data: () => ({
    benchmarkDone: false
    , loading: false
    , chart: {
      data: []
      , layout: {
        height: 500
        , xaxis: {
          type: 'log'
        }
        , yaxis: {
          type: 'log'
        }
      }
      , options: {}
      , autoResize: true
    }
  })
  , mounted(){
  }
  , methods: {
    exec(){
      this.loading = true
      this.runBenchmark()
        .then( stats => {
          let data = stats.reduce( (sets, stat) => {
            const iterations = stat.iterations
            const jsData = sets[0]
            jsData.x.push( iterations )
            jsData.y.push( stat.results.jsResult.elapsed )

            const wasmData = sets[1]
            wasmData.x.push( iterations )
            wasmData.y.push( stat.results.wasmResult.elapsed )
            return sets
          }, [ { name: 'js', x: [], y: [] }, { name: 'wasm', x: [], y: [] } ])

          this.chart.data = data
          this.benchmarkDone = true
        })
        .catch( ( e ) => {
          console.error(e)
          alert( e )
        })
        .finally( () => {
          this.loading = false
        })
    }
    , runBenchmark(){
      const factor = this.scaleFactor
      const iterations = [...Array(this.maxScale).keys()].map((idx) => Math.pow(factor, idx + 1))
      const tests = this.tests

      const assertEquality = Promise.method(( results ) => {
        // TODO better...
        let jsResult = results.jsResult.calculation
        let wasmResult = results.wasmResult.calculation
        if ( !Number.isFinite(jsResult) || !Number.isFinite(wasmResult) ){
          return Promise.reject(
            new Error('Test results must be a number')
          )
        }

        let diff = Math.abs(jsResult - wasmResult)
        if ( diff > 1e-6 ){
          return Promise.reject(
            new Error(`Not comparing apples to apples.
              JS returned ${jsResult}.
              WASM returned ${wasmResult}`
            )
          )
        }
        return results
      })

      return Promise.reduce(iterations, (stats, count) => {
        return Promise.reduce( Object.keys(tests), (results, name) => {
          return this.run( () => tests[name](count) )
            // .tap(console.log)
            .then( result => {
              results[name] = result
              return results
            })
        }, {}).then( this.check ? assertEquality : x => x ).then( results => {
          // { jsResult: {}, wasmResult: {} }
          stats.push({ iterations: count, results })
          return stats
        })
      }, [])
      // .tap(console.log)
      // [{ iterations, results }, ...]
    }
    , run( fn ){
      return Promise.resolve().then( fn )
    }
  }
}
</script>

<style>

</style>
