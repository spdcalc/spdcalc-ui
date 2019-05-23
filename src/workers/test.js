import {js_speed_test} from '@/benchmarks/simple'
// import * as spdc from 'spdcalc'
//
// console.log(spdc)


import('spdcalc').then( m => m.speed_test(100) ).then(console.log)

export async function test(){
  return js_speed_test( 100 )
}
