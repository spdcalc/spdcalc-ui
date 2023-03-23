import jointSpectrum from './joint-spectrum.vue'
import jsiFreq from './jsi-freq.vue'
import jsiSd from './jsi-sd.vue'
import homSeries from './hom-series.vue'
import homTwoSourceSeries from './hom-two-source-series.vue'
import heraldingVWaistSeries from './heralding-v-waist-series.vue'
import countsVThetaSeries from './counts-v-theta-series.vue'
import heraldingHistogramWaists from './heralding-histogram-waists.vue'
import heraldingCalculator from './heralding-calculator.vue'
import SchmidtPumpBwCrystalLen from './schmidt-pbw-crystal-len.vue'

export default [
  {
    label: 'JSI Plot'
    , type: 'joint-spectrum'
    , component: jointSpectrum
  }
  , {
    label: 'JSI Plot (Frequency space)'
    , type: 'jsi-freq'
    , component: jsiFreq
  }
  , {
    label: 'JSI Plot (Sum-Diff axes)'
    , type: 'jsi-sd'
    , component: jsiSd
  }
  , {
    label: 'Schmidt Number (Pump BW vs Crystal Len)'
    , type: 'schmidt-pbw-crystal-len'
    , component: SchmidtPumpBwCrystalLen
  }
  , {
    label: 'Hong-Ou-Mandel Dip'
    , type: 'hom'
    , component: homSeries
  }
  , {
    label: 'Two Source Hong-Ou-Mandel Dip'
    , type: 'hom-two-source'
    , component: homTwoSourceSeries
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
