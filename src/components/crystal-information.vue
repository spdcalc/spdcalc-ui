<template lang="pug">
v-sheet.crystal-info
  .name {{ crystalMeta.name }}
  .axis Axis Type: {{ crystalMeta.axis_type | startCase }}
  .point-group Point Group: {{ crystalMeta.point_group }}
  a(v-if="crystalMeta.reference_url", :href="crystalMeta.reference_url", target="_blank") more info
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'CrystalInformation'
  , props: {
  }
  , data: () => ({
  })
  , components: {
  }
  , computed: {
    ...mapGetters('parameters', {
      crystalMeta: 'crystalMeta'
    })
  }
  , methods: {
  }
}
</script>
