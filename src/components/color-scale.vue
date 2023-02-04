<template lang="pug" functional>
svg(xmlns="http://www.w3.org/2000/svg", version="1.1", width="120", height="32")
  svg(width="100", height="10", x="10", y="10")
    line(
      v-for="(c, x) in props.colorScale.colors(100)"
      , :x1="x+'%'"
      , :x2="x+'%'"
      , y1="0"
      , y2="100%"
      , :stroke="c"
    )
    rect.outline(width="100%", height="100%", :stroke="props.colorScale(0.5)")
  text(x="10", y="10", dx="1", dy="-2") {{ props.colorScale.domain()[0].toFixed(2) }}
  text(x="60", y="10", dx="0", dy="-2") {{ (0.5 * props.colorScale.domain()[1] + 0.5 * props.colorScale.domain()[0]).toFixed(2) }}
  text(x="110", y="10", dx="-1", dy="-2") {{ props.colorScale.domain()[1].toFixed(2) }}
  text(x="60", y="30", dy="-1", :style="{ fill: props.colorScale(1) }") {{ props.title }}
</template>

<script>
export default {
  name: 'ColorScale'
  , props: {
    colorScale: Function
    , title: String
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
