import * as Comlink from 'comlink'

import { calcGaussian } from '@/benchmarks/simple'

const spdcMod = import('spdcalc')
const wasm = import('spdcalc/spdcalc_bg')

async function getGaussian( width, height ){
  const spdc = await spdcMod
  let arr = spdc.get_gaussian( width, height )
  return Comlink.transfer(arr, [arr.buffer])
}

async function getGaussianByPtr( width, height ){
  // const memory = (await wasm).memory
  const spdc = await spdcMod
  let ptr = spdc.get_gaussian_ptr( width, height )
  return ptr
  // let arr = new Float64Array(memory.buffer, ptr, width * height)
  // // return arr
  // return Comlink.transfer(arr, [arr.buffer])
}

async function getGaussianJS( width, height ){
  let arr = calcGaussian( width, height )
  // return arr
  return Comlink.transfer(arr, [arr.buffer])
}

Comlink.expose({
  getGaussian
  , getGaussianByPtr
  , getGaussianJS
})
