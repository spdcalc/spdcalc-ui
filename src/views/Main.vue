<template lang="pug">
v-container.main(fluid)
  v-row()
    v-col(xl="4", lg="6", md="12", sm="12", xs="12", v-for="panel in panels", :key="panel.id")
      v-component(
        :is="panel.type"
        , v-bind="panel.props"
        , @remove="unloadPanel({ id: panel.id })"
        , @select="loadPanel({ id: panel.id, type: $event })"
      )
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import _keyBy from 'lodash/keyBy'
import PanelLoader from '@/components/panel-loader'
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
  padding: 12px 24px
</style>
