import { log, logErr } from '@/lib/logger'
const spdcMod = import('@/wasm/pkg/spdcalcjs')
// init browser debug messages
spdcMod.then( spdc => spdc.browser_debug() )

async function run( method, ...args ){
  const spdc = await spdcMod

  const fn = spdc[method]
  if ( !fn ){
    throw new Error(`Method ${method} not defined`)
  }

  try {
    log(`Worker: Running ${method}`, args)
    return fn.apply( spdc, args )
  } catch( msg ){
    // wasm bingen doesn't throw true js errors....
    let err = new Error( msg )
    logErr(`Worker: ERROR from ${method}`, err)
    throw err
  }
}

export async function fetchCrystalMeta(){
  return run('get_all_crystal_meta')
}

export async function getOptimumIdler( props ){
  return run('get_optimum_idler', props)
}

export async function getJSI( props, integrationConfig ){
  return run('get_jsi_data', props, integrationConfig)
}

export async function getJSICoincNormalizedToSingles( props, integrationConfig ){
  return run('get_jsi_coinc_normalized_to_singles_data', props, integrationConfig)
}

export async function getJSISinglesSignal( props, integrationConfig ){
  return run('get_jsi_singles_signal_data', props, integrationConfig)
}

export async function getJSISinglesIdler( props, integrationConfig ){
  return run('get_jsi_singles_idler_data', props, integrationConfig)
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
  return run('get_hom_series_data', props, integrationConfig, timeSteps )
}

export async function getHeraldingResults( props, integrationConfig ){
  return run('get_heralding_results', props, integrationConfig )
}

export async function getHeraldingResultsVsWaist( props, integrationConfig, waistSteps ){
  return run('get_heralding_results_vs_waist', props, integrationConfig, waistSteps )
}

export async function getHeraldingResultsVsSignalTheta( props, integrationConfig, deltaThetaSteps ){
  return run('get_heralding_results_vs_signal_theta', props, integrationConfig, deltaThetaSteps )
}

export async function getHeraldingResultsVsIdlerTheta( props, integrationConfig, deltaThetaSteps ){
  return run('get_heralding_results_vs_idler_theta', props, integrationConfig, deltaThetaSteps )
}

export async function getHeraldingResultsSignalVsIdlerWaists( props, integrationConfig, ranges ){
  return run('get_heralding_results_signal_vs_idler_waists', props, integrationConfig, ranges )
}

export async function getHeraldingResultsPumpVsSignalIdlerWaists( props, integrationConfig, ranges ){
  return run('get_heralding_results_pump_vs_signal_idler_waists', props, integrationConfig, ranges )
}
