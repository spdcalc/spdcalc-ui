<template lang="pug">
  v-layout(row, wrap)
    v-flex(xs12)
      v-card
        v-card-text Test JSA Calc page
</template>

<script>
import worker from 'workerize-loader!@/workers/test'

const instance = worker()

instance.test(1000).then( result => {
  console.log('Worker says: ', result)
})

// const worker = new Worker('./test.js');

export default {
  name: 'JSA'
  , data: () => ({
    tests: {}
  })
  , mounted(){

  }
}
</script>
