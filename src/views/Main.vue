<template lang="pug">
v-container.main(fluid)
  v-row(dense)
    v-component(
      v-for="panel in panels"
      , :key="panel.id"
      , :is="panel.component"
      , v-bind="panel.props"
      , :id="panel.id"
      , @remove="unloadPanel({ id: panel.id })"
      , @select="loadPanel({ id: panel.id, type: $event })"
    )
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import _keyBy from 'lodash/keyBy'
import PanelLoader from '@/components/panel-loader.vue'
import AllPanels from '@/components/panels'

export default {
  name: 'Main'
  , components: {
    PanelLoader
    , ..._keyBy(AllPanels.map(p => p.component), 'name')
  }
  , data: () => ({
  })
  , computed: {
    ...mapGetters('panels', [
      'panels'
    ])
  }
  , methods: {
    ...mapActions('panels', [
      'loadPanel'
      , 'unloadPanel'
    ])
  }
}
</script>

<style lang="sass" scoped>
.main
  // padding: 12px 24px
  padding: 10px 10px
</style>
