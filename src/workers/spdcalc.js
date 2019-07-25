const spdcMod = import('@/wasm/pkg/spdcalcjs')

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
