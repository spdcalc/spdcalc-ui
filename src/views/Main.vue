<template lang="pug">
v-container(fluid, grid-list-lg)
  v-layout(row, wrap)
    v-flex(sm6, xs12, v-for="plot in plots", :key="plot.uid", grow)
      v-component(:is="plot.type", @remove="remove(plot)", @select="loadPlot(plot, $event)")
</template>

<script>
import _uniqueId from 'lodash/uniqueId'
import _differenceBy from 'lodash/differenceBy'
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
