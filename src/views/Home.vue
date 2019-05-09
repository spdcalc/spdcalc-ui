<template lang="pug">
  v-container
    v-layout(text-xs-center, wrap)
      Benchmark(title="Simple Calculation", :tests="tests.simple", :scale-factor="10", :max-scale="7")

      Benchmark(title="Array Allocation", :tests="tests.arrayAllocation", :scale-factor="10", :max-scale="8")
</template>

<script>
import Benchmark from '@/components/benchmark'
import * as Simple from '@/benchmarks/simple'

export default {
  components: {
    Benchmark
  }
  , data: () => ({
    tests: {}
  })
  , created(){
    this.tests.simple = {
      jsResult: (iterations) => Simple.js_speed_test(iterations)
      , wasmResult: (iterations) => {
        let data = this.$wasm.wasmTest.speed_test(iterations)
        data = JSON.parse(data)
        return {
          calculation: data[0]
          , elapsed: data[1]
        }
      }
    }

    this.tests.arrayAllocation = {
      jsResult: (iterations) => Simple.reserve_array_test(iterations)
      , wasmResult: (iterations) => {
        let data = this.$wasm.wasmTest.reserve_array_test(iterations)
        data = JSON.parse(data)
        return {
          calculation: data[0]
          , elapsed: data[1]
        }
      }
    }
  }
}
</script>
