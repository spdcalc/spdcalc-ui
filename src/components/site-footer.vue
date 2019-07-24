<template lang="pug">
v-footer(app, dark)
  v-container.py-0.white--text(fluid)
    v-layout(columns)
      v-flex(xs6) Footer
      v-flex(xs6)
        .text-right {{jobName}} took {{runTime.toFixed(2)}}ms
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
    ])
  }
  , methods: {
  }
}
</script>
