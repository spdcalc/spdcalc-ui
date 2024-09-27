import { log, logErr } from '@/lib/logger'
import init, * as spdc from '@rsw/spdcalcwasm'
import { transfer } from 'comlink'

let ready = init()
// import * as spdc from 'spdcalcwasm'
// init browser debug messages

if (process.env.NODE_ENV === 'development') {
  ready.then(() => {
    spdc.browser_debug()
  })
}

// ready = ready.then(() => {
//   return spdc.initThreadPool(navigator.hardwareConcurrency).catch(console.error)
// })

async function run(method, ...args) {
  await ready
  const fn = spdc[method]
  if (!fn) {
    throw new Error(`Method ${method} not defined`)
  }

  try {
    let ret = fn.apply(spdc, args)
    log(`Worker: Running ${method}`, args, '\nReturned:', ret)
    return ret
  } catch (msg) {
    // wasm bingen doesn't throw true js errors....
    let err = new Error(msg)
    logErr(`Worker: ERROR from ${method}`, err)
    throw err
  }
}

async function toIntegrationConfig(cfg) {
  await ready
  return spdc.IntegrationConfig.new(
    cfg.ls_min,
    cfg.ls_max,
    cfg.li_min,
    cfg.li_max,
    cfg.size
  )
}

async function toWaistRanges(cfg) {
  await ready
  return spdc.WaistRanges.new(
    cfg.x_range[0],
    cfg.x_range[1],
    cfg.y_range[0],
    cfg.y_range[1],
    cfg.x_count,
    cfg.y_count
  )
}

async function toGrid2D(cfg) {
  await ready
  return spdc.Grid2D.new(
    cfg.x_range[0],
    cfg.x_range[1],
    cfg.y_range[0],
    cfg.y_range[1],
    cfg.x_count,
    cfg.y_count
  )
}

export async function getJson(props) {
  return run('get_json', props)
}

export async function getParamsFromJson(json) {
  return run('get_params_from_json', json)
}

export async function fetchCrystalMeta() {
  return run('get_all_crystal_meta')
}

export async function getOptimumIdler(props) {
  return run('get_optimum_idler', props)
}

export async function getJointSpectrum(props, integrationConfig) {
  const iap = await run(
    'get_joint_spectrum',
    props,
    await toIntegrationConfig(integrationConfig)
  )
  const ret = {
    intensities: iap.intensities(),
    amplitudes: iap.amplitudes(),
    phases: iap.phases(),
    schmidt_number: iap.schmidt_number(),
  }
  return transfer(
    ret,
    Object.values(ret)
      .filter((v) => v?.buffer)
      .map((v) => v.buffer)
  )
}

export async function getJointSpectrumFreq(props, integrationConfig) {
  const iap = await run(
    'get_joint_spectrum_freq',
    props,
    await toIntegrationConfig(integrationConfig)
  )
  const ret = {
    intensities: iap.intensities(),
    amplitudes: iap.amplitudes(),
    phases: iap.phases(),
    schmidt_number: iap.schmidt_number(),
  }
  return transfer(
    ret,
    Object.values(ret)
      .filter((v) => v?.buffer)
      .map((v) => v.buffer)
  )
}

export async function getJointSpectrumSumDiff(props, integrationConfig) {
  const iap = await run(
    'get_joint_spectrum_sum_diff',
    props,
    await toIntegrationConfig(integrationConfig)
  )
  const ret = {
    intensities: iap.intensities(),
    amplitudes: iap.amplitudes(),
    phases: iap.phases(),
    schmidt_number: iap.schmidt_number(),
  }
  return transfer(
    ret,
    Object.values(ret)
      .filter((v) => v?.buffer)
      .map((v) => v.buffer)
  )
}

export async function getJSICSI(props, integrationConfig) {
  const jsi = await run(
    'get_jsi_csi',
    props,
    await toIntegrationConfig(integrationConfig)
  )
  return transfer(jsi, jsi.buffer)
}

export async function calculateCrystalTheta(props) {
  return run('calculate_crystal_theta', props)
}

export async function calculatePeriodicPoling(props) {
  return run('calculate_periodic_poling', props)
}

export async function getWaistPositions(props) {
  return run('get_waist_positions', props)
}

export async function getRefractiveIndices(props) {
  return run('get_refractive_indices', props)
}

export async function calculateJSIRanges(props) {
  return run('calculate_jsi_plot_ranges', props)
}

export async function getHOMSeries(props, integrationConfig, timeSteps) {
  return run(
    'get_hom_series_data',
    props,
    await toIntegrationConfig(integrationConfig),
    timeSteps
  )
}

export async function getHOMVisibility(props, integrationConfig) {
  return run(
    'get_hom_visibility',
    props,
    await toIntegrationConfig(integrationConfig)
  )
}

export async function getHOMTwoSourceSeries(
  props,
  integrationConfig,
  timeSteps
) {
  return run(
    'get_hom_two_source_series_data',
    props,
    await toIntegrationConfig(integrationConfig),
    timeSteps
  )
}

export async function getHOMTwoSourceVisibility(props, integrationConfig) {
  return run(
    'get_hom_two_source_visibility',
    props,
    await toIntegrationConfig(integrationConfig)
  )
}

export async function getHeraldingResults(
  props,
  integrationConfig,
  signalWaist,
  idlerWaist,
  pumpWaist
) {
  props.signal_waist = signalWaist || props.signal_waist
  props.idler_waist = idlerWaist || props.idler_waist
  props.pump_waist = pumpWaist || props.pump_waist
  return run(
    'get_heralding_results',
    props,
    await toIntegrationConfig(integrationConfig)
  )
}

export async function getHeraldingResultsVsWaist(
  props,
  integrationConfig,
  waistSteps
) {
  return run(
    'get_heralding_results_vs_waist',
    props,
    await toIntegrationConfig(integrationConfig),
    waistSteps
  )
}

export async function getHeraldingResultsVsSignalTheta(
  props,
  integrationConfig,
  deltaThetaSteps
) {
  return run(
    'get_heralding_results_vs_signal_theta',
    props,
    await toIntegrationConfig(integrationConfig),
    deltaThetaSteps
  )
}

export async function getHeraldingResultsVsIdlerTheta(
  props,
  integrationConfig,
  deltaThetaSteps
) {
  return run(
    'get_heralding_results_vs_idler_theta',
    props,
    await toIntegrationConfig(integrationConfig),
    deltaThetaSteps
  )
}

export async function getHeraldingResultsSignalVsIdlerWaists(
  props,
  integrationConfig,
  ranges
) {
  return run(
    'get_heralding_results_signal_vs_idler_waists',
    props,
    await toIntegrationConfig(integrationConfig),
    await toWaistRanges(ranges)
  )
}

export async function getHeraldingResultsPumpVsSignalIdlerWaists(
  props,
  integrationConfig,
  ranges
) {
  return run(
    'get_heralding_results_pump_vs_signal_idler_waists',
    props,
    await toIntegrationConfig(integrationConfig),
    await toWaistRanges(ranges)
  )
}

export async function getSchmidtPumpBwVsCrystalLength(
  props,
  integrationConfig,
  ranges
) {
  return run(
    'get_schmidt_pump_bw_vs_crystal_length',
    props,
    await toIntegrationConfig(integrationConfig),
    await toGrid2D(ranges)
  )
}

export async function getSchmidtSignalWaistVsPumpWaist(
  props,
  integrationConfig,
  ranges
) {
  return run(
    'get_schmidt_signal_vs_pump_waist',
    props,
    await toIntegrationConfig(integrationConfig),
    await toWaistRanges(ranges)
  )
}

export async function getSchmidtIdlerWaistVsSignalWaist(
  props,
  integrationConfig,
  ranges
) {
  return run(
    'get_schmidt_idler_vs_signal_waist',
    props,
    await toIntegrationConfig(integrationConfig),
    await toWaistRanges(ranges)
  )
}

export async function getHomVisSignalWaistVsPumpWaist(
  props,
  integrationConfig,
  ranges
) {
  return run(
    'get_hom_visibility_signal_vs_pump_waist',
    props,
    await toIntegrationConfig(integrationConfig),
    await toWaistRanges(ranges)
  )
}

export async function getHomVisIdlerWaistVsSignalWaist(
  props,
  integrationConfig,
  ranges
) {
  return run(
    'get_hom_visibility_idler_vs_signal_waist',
    props,
    await toIntegrationConfig(integrationConfig),
    await toWaistRanges(ranges)
  )
}

export async function getDeltaKVsCrystalTheta(props) {
  return run('delta_k_vs_crystal_theta', props)
}

export async function getCenterJsiVsCrystalTheta(props) {
  return run('center_jsi_vs_crystal_theta', props)
}

export async function getDeltaKVsPP(props) {
  return run('delta_k_vs_pp', props)
}

export async function getCenterJsiVsPP(props) {
  return run('center_jsi_vs_pp', props)
}

export async function getPolingDomains(props) {
  return run('poling_domains', props)
}

export async function getPmIntegrand(props, ls, li) {
  run('print_integrand_osc_data', props, ls, li)
  return run('pm_integrand', props, ls, li)
}

export async function getPmCurve(props, prop1, prop2, grid) {
  return run('pm_curve', props, prop1, prop2, await toGrid2D(grid))
}
