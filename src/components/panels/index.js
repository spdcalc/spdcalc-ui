import jsi from './jsi'
import homSeries from './hom-series'
import heraldingVWaistSeries from './heralding-v-waist-series'
import countsVThetaSeries from './counts-v-theta-series'
import heraldingHistogramWaists from './heralding-histogram-waists'
import heraldingCalculator from './heralding-calculator'

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
    label: 'Counts vs Beam Theta'
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
