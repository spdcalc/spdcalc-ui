<template lang="pug">
v-container.main(fluid, grid-list-lg)
  v-layout(row, wrap)
    v-flex(xl4, lg6, md12, sm12, xs12, v-for="plot in plots", :key="plot.uid", grow)
      v-component(:is="plot.type", @remove="remove(plot)", @select="loadPlot(plot, $event)")
</template>

<script>
import _uniqueId from 'lodash/uniqueId'
import PlotLoader from '@/components/plots/plot-loader'
import jsi from '@/components/plots/jsi'

export default {
  name: 'Main'
  , components: {
    jsi
    , PlotLoader
  }
  , data: () => ({
    plots: [{
      uid: _uniqueId('plot')
      , type: 'jsi'
    }, {
      uid: _uniqueId('plot')
      , type: 'PlotLoader'
    }, {
      uid: _uniqueId('plot')
      , type: 'PlotLoader'
    }, {
      uid: _uniqueId('plot')
      , type: 'PlotLoader'
    }]
  })
  , methods: {
    getPlaceholder(){
      return {
        uid: _uniqueId('plot')
        , type: 'PlotLoader'
      }
    }
    , loadPlot(plot, type){
      plot.type = type
    }
    , remove(plot){
      let index = this.plots.indexOf(plot)
      if ( index < 0 ) return
      this.plots.splice(index, 1, this.getPlaceholder())
    }
  }
}
</script>

<style lang="sass" scoped>
.main
  padding: 0
</style>
