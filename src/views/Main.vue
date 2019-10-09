<template lang="pug">
v-container.main(fluid)
  v-row()
    v-col(xl="4", lg="6", md="12", sm="12", xs="12", v-for="plot in plots", :key="plot.uid")
      v-component(:is="plot.type", @remove="remove(plot)", @select="loadPlot(plot, $event)")
</template>

<script>
import _uniqueId from 'lodash/uniqueId'
import PlotLoader from '@/components/plots/plot-loader'
import jsi from '@/components/plots/jsi'
import homSeries from '@/components/plots/hom-series'
import heraldingCalculator from '@/components/tools/heralding-calculator'

export default {
  name: 'Main'
  , components: {
    PlotLoader
    , jsi
    , homSeries
    , heraldingCalculator
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
  padding: 12px 24px
</style>
