const spdcMod = import('@/wasm/pkg/spdcalcjs')
// init browser debug messages
spdcMod.then( spdc => spdc.browser_debug() )

function log( ...args ){
  if ( process.env.NODE_ENV !== 'production' ){
    console.log.apply(console, args)
  }
}

function logErr( ...args ){
  if ( process.env.NODE_ENV !== 'production' ){
    console.error.apply(console, args)
  }
}

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

export async function getJSI( props, integrationConfig ){
  return run('get_jsi_data', props, integrationConfig)
}

export async function calculateCrystalTheta( props ){
  return run('calculate_crystal_theta', props)
}

export async function calculatePeriodicPoling( props ){
  return run('calculate_periodic_poling', props)
}

export async function calculateJSIRanges( props ){
  return run('calculate_jsi_plot_ranges', props)
}

export async function getHOMSeries( props, integrationConfig, timeSteps ){
  return run('get_hom_series_data', props, integrationConfig, timeSteps|0 )
}

export async function getHeraldingResults( props, integrationConfig, signal_wavelength, idler_wavelength ){
  return run('get_heralding_results', props, integrationConfig, +signal_wavelength, +idler_wavelength )
}
