const spdcMod = import('@/wasm/pkg/spdcalcjs')

export async function getJSI( props, jsiConfig ){
  const spdc = await spdcMod
  return spdc.get_jsi_data( props, jsiConfig )
}
