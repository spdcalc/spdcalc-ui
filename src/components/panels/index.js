import jsi from './jsi'
import homSeries from './hom-series'
import heraldingVWaistSeries from './heralding-v-waist-series'
import heraldingHistogramWaists from './heralding-histogram-waists'
import heraldingCalculator from './heralding-calculator'

export default [
  {
    label: 'JSI Plot'
    , component: jsi
  }
  , {
    label: 'Hong-Ou-Mandel Dip'
    , component: homSeries
  }
  , {
    label: 'Heralding vs Waist Size'
    , component: heraldingVWaistSeries
  }
  , {
    label: 'Heralding efficiency (signal vs idler waist)'
    , component: heraldingHistogramWaists
    , props: { mode: 'signal-vs-idler' }
  }
  , {
    label: 'Heralding efficiency (pump vs s/i waist)'
    , component: heraldingHistogramWaists
    , props: { mode: 'pump-vs-signal' }
  }
  , {
    label: 'Heralding Calculator'
    , component: heraldingCalculator
  }
]
