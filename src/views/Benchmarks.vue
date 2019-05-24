<template lang="pug">
  v-container
    v-layout(text-xs-center, wrap)
      Benchmark(title="Gaussian", :tests="tests.gaussian", :scale-factor="2", :max-scale="12")

      Benchmark(title="Gaussian as ptr", :tests="tests.gaussianPtr", :scale-factor="2", :max-scale="12", :check="false")
</template>

<script>
import Benchmark from '@/components/benchmark'
import * as Comlink from 'comlink'
import clworker from 'worker-loader!@/workers/comlink'

const Tests = Comlink.wrap( new clworker() )

async function time( fn ){
  let start = window.performance.now()
  return Promise.resolve().then(fn).then( result => {
    let elapsed = window.performance.now() - start
    return {
      calculation: result
      , elapsed
    }
  })
}

export default {
  components: {
    Benchmark
  }
  , data: () => ({
    tests: {}
  })
  , created(){
    this.tests.gaussian = {
      jsResult: (iterations) => time(() => Tests.getGaussianJS(iterations, iterations).then( r => r.length ))
      , wasmResult: (iterations) => time(() => Tests.getGaussian(iterations, iterations).then( r => r.length ))
    }

    this.tests.gaussianPtr = {
      jsResult: (iterations) => time(() => Tests.getGaussianJS(iterations, iterations).then( r => r.length ))
      , wasmResult: (iterations) => time(() => Tests.getGaussianByPtr(iterations, iterations).then( r => r.length ))
    }
  }
}
</script>
