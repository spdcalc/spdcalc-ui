const spdcMod = import('@/wasm/pkg/spdcalcjs')

async function run( method, ...args ){
  const spdc = await spdcMod
  try {
    return spdc[method].apply( spdc, args )
  } catch( msg ){
    // wasm bingen doesn't throw true js errors....
    throw new Error( msg )
  }
}

export async function getJSI( props, jsiConfig ){
  return run('get_jsi_data', props, jsiConfig)
}
