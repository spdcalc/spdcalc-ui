<template lang="pug" functional>
svg(xmlns="http://www.w3.org/2000/svg", version="1.1", width="130", height="32")
  svg(width="100", height="10", x="10", y="10")
    line(
      v-for="x in 100"
      , :x1="x+'%'"
      , :x2="x+'%'"
      , y1="0"
      , y2="100%"
      , :stroke="props.colorScale(props.scale($options.methods.lerp(props.scale.domain()[0], props.scale.domain()[1], x / 100)))"
    )
    rect.outline(width="100%", height="100%", stroke-width="1.5" stroke="white")
    rect.outline(width="100%", height="100%", :stroke="props.colorScale(0.5)")
  text(x="10", y="10", dx="1", dy="-2") {{ $options.methods.formatNumber(props.scale.invert(0)) }}
  text(x="60", y="10", dx="0", dy="-2") {{ $options.methods.formatNumber(props.scale.invert(.5)) }}
  text(x="110", y="10", dx="-1", dy="-2") {{ $options.methods.formatNumber(props.scale.invert(1)) }}
  text(x="60", y="30", dy="-1", :style="{ fill: props.colorScale(1) }") {{ props.title }}
</template>

<script>
import lerp from '@/lib/lerp'
export default {
  name: 'ColorScale'
  , props: {
    colorScale: Function
    , scale: Function
    , title: String
  },
  methods: {
    lerp,
    formatNumber(n){
      const v = Math.abs(n)
      if (v < 0.01){
        return n.toPrecision(2)
      }
      if (v < 10){
        return n.toFixed(2)
      }
      if (v < 1000){
        return n.toFixed(0)
      }
      return n.toPrecision(2)
    }
  }
}
</script>

<style lang="sass" scoped>
text
  font-size: 10px
  fill: map-get($flat-ui, 'midnight-blue')
  stroke-width: .1
  text-anchor: middle
.outline
  fill: none
</style>
