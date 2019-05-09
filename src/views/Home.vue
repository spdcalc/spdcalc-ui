<template lang="pug">
  v-container
    v-layout(text-xs-center, wrap)
      Benchmark(title="Simple Calculation", :tests="tests.simple", :scale-factor="10", :max-scale="7")
</template>

<script>
import Benchmark from '@/components/benchmark'
import jsSpeedTest from '@/benchmarks/simple'

export default {
  components: {
    Benchmark
  }
  , data: () => ({
    tests: {}
  })
  , created(){
    this.tests.simple = {
      jsResult: (iterations) => jsSpeedTest(iterations)
      , wasmResult: (iterations) => {
        let data = this.$wasm.wasmTest.speed_test(iterations)
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
