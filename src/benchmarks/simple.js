function norm( arr ){
  let [y_re, y_im] = arr
  return Math.sqrt(y_re * y_re + y_im * y_im)
}

function calc( val ){
  let x_re = val
  let x_im = val * val

  //sqrt x
  let r = Math.sqrt((x_re * x_re)+(x_im * x_im))
  let realNum = x_re + r
  let denom = Math.sqrt(2 * realNum)
  let sqrt_re = realNum / denom
  let sqrt_im = x_im / denom

  // exp x
  r = Math.exp(x_re)
  let exp_re = r * Math.cos(x_im)
  let exp_im = r * Math.sin(x_im)

  let y_re = sqrt_re - exp_re
  let y_im = sqrt_im - exp_im

  // norm
  return norm([ y_re, y_im ])
}

function init( counts ){
  let test_values = new Float64Array( counts )

  for (let i = 0; i < counts; i++){
    test_values[i] = i + 1
  }

  return test_values
}

export function reserve_array_test(size){
  let start = window.performance.now()

  let arr = init( size )

  let end = window.performance.now()

  let elapsed = end - start

  return {
    calculation: size
    , elapsed
  }
}

export function js_speed_test(counts){
  let test_values = init( counts )
  let total = 0

  let start = window.performance.now()
  for (let i = 0; i < counts; i++){
    //sqrt x
    total += calc( 1 / test_values[i] )
  }

  let end = window.performance.now()

  let elapsed = end - start

  return {
    calculation: total
    , elapsed
  }
}
