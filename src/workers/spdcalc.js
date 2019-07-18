const spdcMod = import('@/wasm/pkg/spdcalcjs')

export async function getJSI( width, height ){
  const spdc = await spdcMod
  return spdc.get_jsi_data( width, height )
}
