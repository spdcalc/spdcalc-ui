<template lang="pug">
v-container.main(fluid)
  v-row()
    v-col(xl="4", lg="6", md="12", sm="12", xs="12", v-for="plot in plots", :key="plot.uid")
      v-component(:is="plot.type", v-bind="plot.props", @remove="remove(plot)", @select="loadPlot(plot, $event)")
</template>

<script>
import _uniqueId from 'lodash/uniqueId'
import PanelLoader from '@/components/panel-loader'
import jsi from '@/components/plots/jsi'
import homSeries from '@/components/plots/hom-series'
import heraldingVWaistSeries from '@/components/plots/heralding-v-waist-series'
import heraldingHistogramWaists from '@/components/plots/heralding-histogram-waists'
import heraldingCalculator from '@/components/tools/heralding-calculator'

// TODO: optimize by using async module loading
export default {
  name: 'Main'
  , components: {
    PanelLoader
    , jsi
    , homSeries
    , heraldingVWaistSeries
    , heraldingHistogramWaists
    , heraldingCalculator
  }
  , data: () => ({
    plots: [{
      uid: _uniqueId('plot')
      , type: 'jsi'
    }, {
      uid: _uniqueId('plot')
      , type: 'PanelLoader'
    }, {
      uid: _uniqueId('plot')
      , type: 'PanelLoader'
    }, {
      uid: _uniqueId('plot')
      , type: 'PanelLoader'
    }]
  })
  , methods: {
    getPlaceholder(){
      return {
        uid: _uniqueId('plot')
        , type: 'PanelLoader'
      }
    }
    , loadPlot(plot, { type, props }){
      plot.type = type
      plot.props = props
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
