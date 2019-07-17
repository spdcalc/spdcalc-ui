import { calcGaussian } from '@/benchmarks/simple'

const spdcMod = import('spdcalcjs')
const wasm = import('spdcalcjs/spdcalcjs_bg')

export async function getGaussian( width, height ){
  const spdc = await spdcMod
  // let arr = spdc.get_gaussian(width, height)
  let arr = spdc.get_jsi_data(width, height)
  return arr
}

export async function getGaussianByPtr( width, height ){
  // const memory = (await wasm).memory
  const spdc = await spdcMod
  let ptr = spdc.get_gaussian_ptr( width, height )
  return ptr
  // let arr = new Float64Array(memory.buffer, ptr, width * height)
  // // return arr
  // return Comlink.transfer(arr, [arr.buffer])
}

export async function getGaussianJS( width, height ){
  let arr = calcGaussian( width, height )
  // return arr
  return arr
}

export async function getIndices( crystalName, wavelength, temperature ){
  const spdc = await spdcMod
  return spdc.get_indices( crystalName, wavelength, temperature )
}
