import Promise from 'bluebird'
import _times from 'lodash/times'
import { log, logErr } from '@/lib/logger'

const cpuCores = navigator.hardwareConcurrency || 2

function execSingleWorker(worker, method, args){
  let start = performance.now()
  log(`Single ${method}:`, args)
  return worker[method].apply(worker, args).then( result => {
    let duration = performance.now() - start
    return {
      result
      , duration
    }
  })
}

function execBatch(workers, method, argList){
  let start = performance.now()
  log(`Batch ${method}:`, argList)
  return Promise.map(workers, (worker, index) => {
    return worker[method].apply(worker, argList[index])
  }).tapCatch(err => {
    logErr(`Worker: ERROR running batch ${method}`, err)
  }).then(result => {
    let duration = performance.now() - start
    log(`Completed batch ${method} in ${duration}ms`)
    return {
      result
      , duration
    }
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
    return exec(method, argList).then(({ result, duration }) => ({
      result: concatResults(result)
      , duration
    }))
  }

  let selected = 0
  function execSingle(method, ...args){
    selected = (selected++) % concurrency
    let worker = workers[selected]
    return execSingleWorker(worker, method, args)
  }

  return {
    exec
    , execAndConcat
    , execSingle
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
