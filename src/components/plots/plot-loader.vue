<template lang="pug">
v-card.card(flat, :class="{ nocta: show }")
  v-responsive.content(ref="plotWrap", :aspect-ratio="1", @click="show = !show")
    v-list.list(v-if="show")
      v-list-item(v-for="(plot, i) in plots", :key="i", @click.stop="$emit('select', plot.type)")
        v-list-item-content
          v-list-item-title {{ plot.name }}
</template>

<script>
export default {
  name: 'PlotLoader'
  , components: {
  }
  , data: () => ({
    show: false
    , plots: [
      {
        name: 'JSI Plot'
        , type: 'jsi'
      }
    ]
  })
  , methods: {

  }
}
</script>

<style lang="sass" scoped>
.list
  padding: 12px
.card
  transition: all 0.15s ease
  border: 1px dotted #ccc
  background: transparent
  cursor: pointer

  &:not(.nocta):before
    position: absolute
    bottom: 0
    right: 0
    transition: color .15s ease
    content: 'load plot...'
    display: block
    padding: 2em
    color: transparent

  &:hover
    &:before
      color: #666
    border-color: #1976d2
.content
  padding-bottom: 64px
</style>
