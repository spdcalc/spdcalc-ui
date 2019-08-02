<template lang="pug">
v-container(fluid, grid-list-lg)
  v-layout(row, wrap)
    v-flex(sm6, xs12, v-for="plotName in plots")
      v-component(:is="plotName")
</template>

<script>
import jsi from '@/components/plots/jsi'

export default {
  name: 'Main'
  , components: {
    jsi
  }
  , data: () => ({
    plots: ['jsi']
  })
}
</script>
