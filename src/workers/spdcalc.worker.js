import { log, logErr } from '@/lib/logger'
import init, * as spdc from '@rsw/spdcalcwasm'

const ready = init()
// import * as spdc from 'spdcalcwasm'
// init browser debug messages

async function run( method, ...args ){
  await ready
  const fn = spdc[method]
  if ( !fn ){
    throw new Error(`Method ${method} not defined`)
  }

  try {
    let ret = fn.apply( spdc, args )
    log(`Worker: Running ${method}`, args, '\nReturned:', ret)
    return ret
  } catch( msg ){
    // wasm bingen doesn't throw true js errors....
    let err = new Error( msg )
    logErr(`Worker: ERROR from ${method}`, err)
    throw err
  }
}

async function toIntegrationConfig(cfg){
  await ready
  return spdc.IntegrationConfig.new(cfg.ls_min, cfg.ls_max, cfg.li_min, cfg.li_max, cfg.size)
}

async function toWaistRanges(cfg){
  await ready
  return spdc.WaistRanges.new(cfg.x_range[0], cfg.x_range[1], cfg.y_range[0], cfg.y_range[1], cfg.x_count, cfg.y_count)
}

export async function fetchCrystalMeta(){
  return run('get_all_crystal_meta')
}

export async function getOptimumIdler( props ){
  return run('get_optimum_idler', props)
}

export async function getJSI( props, integrationConfig ){
  return run('get_jsi_data', props, await toIntegrationConfig(integrationConfig))
}

export async function getJSICoincNormalizedToSingles( props, integrationConfig ){
  return run('get_jsi_coinc_normalized_to_singles_data', props, await toIntegrationConfig(integrationConfig))
}

export async function getJSISinglesSignal( props, integrationConfig ){
  return run('get_jsi_singles_signal_data', props, await toIntegrationConfig(integrationConfig))
}

export async function getJSISinglesIdler( props, integrationConfig ){
  return run('get_jsi_singles_idler_data', props, await toIntegrationConfig(integrationConfig))
}

export async function calculateCrystalTheta( props ){
  return run('calculate_crystal_theta', props)
}

export async function calculatePeriodicPoling( props ){
  return run('calculate_periodic_poling', props)
}

export async function getWaistPositions( props ){
  return run('get_waist_positions', props)
}

export async function getRefractiveIndices( props ){
  return run('get_refractive_indices', props)
}

export async function calculateJSIRanges( props ){
  return run('calculate_jsi_plot_ranges', props)
}

export async function getHOMSeries( props, integrationConfig, timeSteps ){
  return run('get_hom_series_data', props, await toIntegrationConfig(integrationConfig), timeSteps )
}

export async function getHeraldingResults( props, integrationConfig ){
  return run('get_heralding_results', props, await toIntegrationConfig(integrationConfig) )
}

export async function getHeraldingResultsVsWaist( props, integrationConfig, waistSteps ){
  return run('get_heralding_results_vs_waist', props, await toIntegrationConfig(integrationConfig), waistSteps )
}

export async function getHeraldingResultsVsSignalTheta( props, integrationConfig, deltaThetaSteps ){
  return run('get_heralding_results_vs_signal_theta', props, await toIntegrationConfig(integrationConfig), deltaThetaSteps )
}

export async function getHeraldingResultsVsIdlerTheta( props, integrationConfig, deltaThetaSteps ){
  return run('get_heralding_results_vs_idler_theta', props, await toIntegrationConfig(integrationConfig), deltaThetaSteps )
}

export async function getHeraldingResultsSignalVsIdlerWaists( props, integrationConfig, ranges ){
  return run('get_heralding_results_signal_vs_idler_waists', props, await toIntegrationConfig(integrationConfig), await toWaistRanges(ranges) )
}

export async function getHeraldingResultsPumpVsSignalIdlerWaists( props, integrationConfig, ranges ){
  return run('get_heralding_results_pump_vs_signal_idler_waists', props, await toIntegrationConfig(integrationConfig), await toWaistRanges(ranges) )
}
