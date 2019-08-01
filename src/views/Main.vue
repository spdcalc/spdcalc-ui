<template lang="pug">
v-container(fluid, grid-list-lg)
  v-layout(row, wrap)
    v-flex(sm6, xs12)
      jsi
</template>

<script>
import jsi from '@/components/plots/jsi'

export default {
  name: 'Main'
  , components: {
    jsi
  }
}
</script>
