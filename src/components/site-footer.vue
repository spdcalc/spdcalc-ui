<template lang="pug">
v-footer.footer(app, dark, padless, height="38")
  v-progress-linear.progress(
    indeterminate
    , v-show="loading"
  )
  v-container.py-1.white--text(fluid)
    v-layout(columns)
      v-flex(xs6) Footer
      v-flex(xs6, v-if="latestJob")
        .text-right(v-if="loading") {{latestJob}} calculating...
        .text-right(v-else) {{latestJob}} took {{time.toFixed(2)}}ms
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
    job(){
      return this.jobs[this.latestJob] || {}
    }
    , loading(){
      return this.job.running
    }
    , time(){
      return this.job.runTime
    }
    , ...mapGetters('jobs', [
      'jobs'
      , 'latestJob'
    ])
  }
  , methods: {
  }
}
</script>

<style lang="sass" scoped>
.footer
  z-index: 7
.progress
  position: absolute
  top: 0
</style>
