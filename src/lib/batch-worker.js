import Promise from 'bluebird'
import { releaseProxy } from 'comlink'
import _times from 'lodash/times'
import _sumBy from 'lodash/sumBy'
import _partialRight from 'lodash/partialRight'
import { log, logErr } from '@/lib/logger'

const cpuCores = navigator.hardwareConcurrency || 2

function execSingleWorker(workers, selected, method, args, onCancel){
  return Promise.resolve(workers[`_spdPromise_${selected}`]).catchReturn(false).then(() => {
    let worker = workers[selected]
    let start = performance.now()
    log(`Single ${method}:`, args)

    let p = workers[`_spdPromise_${selected}`] = worker[method].apply(worker, args).then( result => {
      let duration = performance.now() - start
      return {
        result
        , duration
      }
    })

    return makeCancelable(p, onCancel)
  })
}

function execBatch(workers, method, argList = [], onCancel){
  return Promise.resolve(workers._spdPromise).catchReturn(false).then(() => {
    let start = performance.now()
    log(`Batch ${method}:`, argList)

    workers._spdPromise = Promise.map(workers, (worker, index) => {
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

    return makeCancelable(workers._spdPromise, onCancel)
  })
}

function concatenate(arrays) {
  let A = arrays[0] ? arrays[0].constructor : Array
  if ( A.prototype.set ){
    let totalLength = _sumBy(arrays, a => a.length)
    let result = new A(totalLength)
    let offset = 0
    for (let arr of arrays) {
      result.set(arr, offset)
      offset += arr.length
    }
    return result
  } else {
    let result = new A()
    for (let arr of arrays) {
      A.prototype.push.apply(result, arr)
    }
    return result
  }
}

const concatResults = results => {
  // reassemble
  return concatenate(results)
  // return results.reduce((res, part) => res.concat(part), new A())
}

function makeCancelable(promise, cancelCallback){
  return new Promise((resolve, reject, onCancel) => {
    promise.then(resolve, reject)
    onCancel(cancelCallback)
  })
}

export function BatchWorker( factory, concurrency = cpuCores ){
  const workers = _times(concurrency, factory)

  function replaceWorker(i){
    log('worker replaced ', i)
    // FIXME: this doesn't stop the work. Need access to the webWorker, not just proxy
    workers[i][releaseProxy]()
    workers[i] = factory()
  }

  function replaceWorkers(){
    for (let i = 0; i < concurrency; i++){
      replaceWorker(i)
    }
  }

  function exec(method, argList){
    return execBatch(workers, method, argList, replaceWorkers)
  }

  function execAndConcat(method, argList){
    return exec(method, argList).then(({ result, duration }) => ({
      result: concatResults(result)
      , duration
    }))
  }

  let selected = 0
  function execSingle(method, ...args){
    selected = (selected + 1) % concurrency
    return execSingleWorker(workers, selected, method, args, replaceWorker.bind(null, selected))
  }

  return {
    exec
    , execAndConcat
    , execSingle
    , partitionSteps: _partialRight(partitionSteps, concurrency)
    , workers
    , length: concurrency
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
