<template lang="pug">
SPDCol
  v-card.card(flat, :class="{ nocta: show }", color="panel")
    v-responsive.content(:aspect-ratio="1", @click="show = !show")
      v-list.list(v-if="show")
        v-list-item(v-for="(panel, i) in AllPanels", :key="i", @click.stop="$emit('select', panel.type)")
          v-list-item-content
            v-list-item-title {{ panel.label }}
      | &nbsp;
</template>

<script>
import AllPanels from '@/components/panels'
import SPDCol from '@/components/spd-col.vue'

export default {
  name: 'PlotLoader'
  , components: {
    SPDCol
  }
  , data: () => ({
    show: false
    , AllPanels
  })
  , methods: {

  }
}
</script>

<style lang="sass" scoped>
.list
  padding: 12px
.card
  height: 100%
  transition: all 0.15s ease
  border: 1px dotted #ccc
  background: transparent
  cursor: pointer

  &:not(.nocta):before
    position: absolute
    top: 50%
    left: 0
    right: 0
    transition: color .15s ease
    content: 'load plot'
    display: block
    margin-top: -1em
    font-size: 24px
    text-align: center
    color: transparent

  &:hover
    &:before
      color: white
    border-color: #1976d2
.content
  padding-bottom: 64px
</style>
