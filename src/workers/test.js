import { calcGaussian } from '@/benchmarks/simple'

// import * as spdc from 'spdcalc'
//
// console.log(spdc)

const spdcMod = import('spdcalc')
const wasm = import('spdcalc/spdcalc_bg')

export async function getGaussian( width, height ){
  const memory = (await wasm).memory
  const spdc = await spdcMod
  let ptr = await spdc.get_gaussian( width, height )
  return new Float64Array(memory.buffer, ptr, width * height)
}

export async function getGaussianJS( width, height ){
  return calcGaussian( width, height )
}
