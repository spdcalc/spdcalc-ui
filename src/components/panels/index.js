import jsi from './jsi.vue'
import homSeries from './hom-series.vue'
import heraldingVWaistSeries from './heralding-v-waist-series.vue'
import countsVThetaSeries from './counts-v-theta-series.vue'
import heraldingHistogramWaists from './heralding-histogram-waists.vue'
import heraldingCalculator from './heralding-calculator.vue'

export default [
  {
    label: 'JSI Plot'
    , type: 'jsi'
    , component: jsi
  }
  , {
    label: 'Hong-Ou-Mandel Dip'
    , type: 'hom'
    , component: homSeries
  }
  , {
    label: 'Heralding vs Waist Size'
    , type: 'heralding-v-ws'
    , component: heraldingVWaistSeries
  }
  , {
    label: 'Counts vs Fiber Theta'
    , type: 'counts-v-theta'
    , component: countsVThetaSeries
  }
  , {
    label: 'Heralding efficiency (signal vs idler waist)'
    , type: 'heralding-svi'
    , component: heraldingHistogramWaists
    , props: { mode: 'signal-vs-idler' }
  }
  , {
    label: 'Heralding efficiency (pump vs s/i waist)'
    , type: 'heralding-pvs'
    , component: heraldingHistogramWaists
    , props: { mode: 'pump-vs-signal' }
  }
  , {
    label: 'Heralding Calculator'
    , type: 'heralding-calc'
    , component: heraldingCalculator
  }
]
