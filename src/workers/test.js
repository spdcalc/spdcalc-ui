import { calcGaussian } from '@/benchmarks/simple'

const spdcMod = import('spdcalc')
const wasm = import('spdcalc/spdcalc_bg')

export async function getGaussian( width, height ){
  const spdc = await spdcMod
  let arr = spdc.get_gaussian( width, height )
  return arr
}

export async function getGaussianByPtr( width, height ){
  const memory = (await wasm).memory
  const spdc = await spdcMod
  let ptr = spdc.get_gaussian( width, height )
  let arr = new Float64Array(memory.buffer, ptr, width * height)
  // return arr
  return arr
}

export async function getGaussianJS( width, height ){
  let arr = calcGaussian( width, height )
  // return arr
  return arr
}
