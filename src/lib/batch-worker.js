import Promise from 'bluebird'
import _times from 'lodash/times'
import { log, logErr } from '@/lib/logger'

const cpuCores = navigator.hardwareConcurrency || 2

function execBatch(workers, method, argList){
  let start = performance.now()
  log(`Batch ${method}:`, argList)
  return Promise.map(workers, (worker, index) => {
    return worker[method].apply(worker, argList[index])
  }).tapCatch(err => {
    logErr(`Worker: ERROR running batch ${method}`, err)
  }).finally(() => {
    let time = performance.now() - start
    log(`Completed batch ${method} in ${time}ms`)
  })
}

const concatResults = results => {
  // reassemble
  let A = results[0].constructor
  return results.reduce((res, part) => res.concat(part), new A())
}

export function BatchWorker( factory, concurrency = cpuCores ){
  const workers = _times(concurrency, factory)

  function exec(method, argList){
    return execBatch(workers, method, argList)
  }

  function execAndConcat(method, argList){
    return exec(method, argList).then(concatResults)
  }

  return {
    exec
    , execAndConcat
    , workers
    , length: workers.length
  }
}

// helper to partition steps
// range = [min, max]
// steps, number of steps to take in that range
// nPartitions number of partitions
export function partitionSteps(range, steps, nPartitions){
  let x0 = range[0]
  let dx = (range[1] - x0) / (steps - 1)
  let n = (steps / nPartitions) | 0
  let remaining = steps % nPartitions
  return _times(nPartitions, (i) => {
    let steps = n + (i < remaining ? 1 : 0)
    let min = x0 + (i * n + Math.min(i, remaining)) * dx
    let max = min + (steps - 1) * dx
    return {
      range: [min, max]
      , count: steps
    }
  })
}
