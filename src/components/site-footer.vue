<template lang="pug">
v-footer(app, dark, padless, height="38")
  v-progress-linear.progress(
    indeterminate
    , v-show="isLoading"
  )
  v-container.py-1.white--text(fluid)
    v-layout(columns)
      v-flex(xs6) Footer
      v-flex(xs6)
        .text-right(v-if="isLoading") {{jobName}} calculating...
        .text-right(v-else) {{jobName}} took {{runTime.toFixed(2)}}ms
  slot
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'SiteFooter'
  , props: {
  }
  , data: () => ({
  })
  , components: {
  }
  , computed: {
    ...mapGetters('jobs', [
      'runTime'
      , 'jobName'
      , 'isLoading'
    ])
  }
  , methods: {
  }
}
</script>

<style lang="sass" scoped>
.progress
  position: absolute
  top: 0
</style>
