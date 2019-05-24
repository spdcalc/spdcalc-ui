import * as Comlink from 'comlink'

import { calcGaussian } from '@/benchmarks/simple'

// import * as spdc from 'spdcalc'
//
// console.log(spdc)

const spdcMod = import('spdcalc')
const wasm = import('spdcalc/spdcalc_bg')

async function getGaussian( width, height ){
  const memory = (await wasm).memory
  const spdc = await spdcMod
  let ptr = spdc.get_gaussian( width, height )
  let arr = new Float64Array(memory.buffer, ptr, width * height)
  // return arr
  return Comlink.transfer(arr, [arr.buffer])
}

async function getGaussianJS( width, height ){
  let arr = calcGaussian( width, height )
  // return arr
  return Comlink.transfer(arr, [arr.buffer])
}

Comlink.expose({
  getGaussian
  , getGaussianJS
})
