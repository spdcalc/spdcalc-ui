import { calcGaussian } from '@/benchmarks/simple'
// import * as spdc from 'spdcalc'
//
// console.log(spdc)

const spdcMod = import('spdcalc')

export async function getGaussian( width, height ){
  const spdc = await spdcMod
  return spdc.get_gaussian( width, height )
}

export function getGaussianJS( width, height ){
  return calcGaussian( width, height )
}
