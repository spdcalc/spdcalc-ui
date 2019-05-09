<template lang="pug">
  v-container
    v-layout(text-xs-center, wrap)
      v-btn(
        large
        , color="primary"
        , :loading="loading"
        , :disabled="loading"
        , @click="exec"
        ) Run Specs
      vue-plotly(v-bind="chart", v-if="specsDone")
</template>

<script>
import Promise from 'bluebird'
import jsSpeedTest from '@/benchmarks/simple'
import VuePlotly from '@statnett/vue-plotly'

export default {
  components: {
    VuePlotly
  }
  , data: () => ({
    specsDone: false
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
      this.runSpecs()
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
          this.specsDone = true
        })
        .catch( ( e ) => {
          alert( e )
        })
        .finally( () => {
          this.loading = false
        })
    }
    , runSpecs(){
      const factor = 10
      const iterations = [...Array(7).keys()].map((idx) => Math.pow(factor, idx + 1))
      const tests = {
        jsResult: (count) => jsSpeedTest(count)
        , wasmResult: (count) => {
          let data = this.$wasm.wasmTest.speed_test(count)
          data = JSON.parse(data)
          return {
            calculation: data[0]
            , elapsed: data[1]
          }
        }
      }

      const assertEquality = Promise.method(( results ) => {
        // TODO better...
        let diff = Math.abs(results.jsResult.calculation - results.wasmResult.calculation)
        if ( diff > 1e-6 ){
          return Promise.reject(
            new Error(`Not comparing apples to apples.
              JS returned ${results.jsResult.calculation}.
              WASM returned ${results.wasmResult.calculation}`
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
        }, {}).then( assertEquality ).then( results => {
          // { jsResult: {}, wasmResult: {} }
          stats.push({ iterations: count, results })
          return stats
        })
      }, [])
      // .tap(console.log)
      // [{ iterations, results }, ...]
    }
    , run( fn ){
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            let data = fn()
            resolve(data)
          } catch( e ){
            reject( e )
          }
        }, 1)
      })
    }
  }
}
</script>

<style>

</style>
