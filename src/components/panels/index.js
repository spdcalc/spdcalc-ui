import JointSpectrum from './joint-spectrum.vue'
import HhomSeries from './hom-series.vue'
import HomTwoSourceSeries from './hom-two-source-series.vue'
import HeraldingVWaistSeries from './heralding-v-waist-series.vue'
import CountsVThetaSeries from './counts-v-theta-series.vue'
import HeraldingHistogramWaists from './heralding-histogram-waists.vue'
import HeraldingCalculator from './heralding-calculator.vue'
import SchmidtPumpBwCrystalLen from './schmidt-pbw-crystal-len.vue'
import InfoPanel from './info-panel.vue'
import DebugPlot from './debug.vue'
import IntegrandPlot from './integrand-plot.vue'
import PmHistogram from './pm-histogram.vue'

export default [
  {
    label: 'JSI Plot',
    type: JointSpectrum.name,
    component: JointSpectrum,
  },
  {
    label: 'Phasematching Curves',
    type: PmHistogram.name,
    component: PmHistogram,
  },
  {
    label: 'Schmidt Number (Pump BW vs Crystal Len)',
    type: SchmidtPumpBwCrystalLen.name,
    component: SchmidtPumpBwCrystalLen,
  },
  {
    label: 'Hong-Ou-Mandel Dip',
    type: HhomSeries.name,
    component: HhomSeries,
  },
  {
    label: 'Two Source Hong-Ou-Mandel Dip',
    type: HomTwoSourceSeries.name,
    component: HomTwoSourceSeries,
  },
  {
    label: 'Heralding vs Waist Size',
    type: HeraldingVWaistSeries.name,
    component: HeraldingVWaistSeries,
  },
  {
    label: 'Counts vs Fiber Theta',
    type: CountsVThetaSeries.name,
    component: CountsVThetaSeries,
  },
  {
    label: 'Heralding efficiency (signal vs idler waist)',
    type: HeraldingHistogramWaists.name,
    component: HeraldingHistogramWaists,
    props: { mode: 'signal-vs-idler' },
  },
  {
    label: 'Heralding efficiency (pump vs s/i waist)',
    type: HeraldingHistogramWaists.name,
    component: HeraldingHistogramWaists,
    props: { mode: 'pump-vs-signal' },
  },
  {
    label: 'Heralding Calculator',
    type: HeraldingCalculator.name,
    component: HeraldingCalculator,
  },
  {
    label: 'Info Panel',
    type: InfoPanel.name,
    component: InfoPanel,
  },
  {
    label: 'Debug Plot',
    type: DebugPlot.name,
    component: DebugPlot,
  },
  {
    label: 'Integrand Plot',
    type: IntegrandPlot.name,
    component: IntegrandPlot,
  },
]
