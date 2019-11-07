<template lang="pug">
v-card.card(flat, :class="{ nocta: show }", color="blue-grey darken-3")
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
      , {
        name: 'Hong-Ou-Mandel Dip'
        , type: 'hom-series'
      }
      , {
        name: 'Heralding vs Waist Size'
        , type: 'heralding-v-waist-series'
      }
      , {
        name: 'Heralding efficiency (signal vs idler waist)'
        , type: 'heralding-signal-vs-idler-waist'
      }
      , {
        name: 'Heralding Calculator'
        , type: 'heralding-calculator'
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
