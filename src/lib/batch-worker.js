import Promise from 'bluebird'
import _times from 'lodash/times'
import _sumBy from 'lodash/sumBy'
import _partialRight from 'lodash/partialRight'
import { log, logErr } from '@/lib/logger'
import createWorkerQueue, { makeThenable } from './worker-queue'

const cpuCores = navigator.hardwareConcurrency || 2

const waiter = (dt) => {
  const ret = {}
  let timeout
  ret.promise = new Promise((resolve) => {
    timeout = setTimeout(resolve, dt)
  })
  ret.cancel = () => {
    clearTimeout(timeout)
  }
  return ret
}

export function interruptDebounce(fn, dt = 100, opts = null) {
  // Need to use weakmap here because component instances
  // must have their own context for wait/receipt
  const cache = new WeakMap()
  return async function exec(...args) {
    const r = cache.get(this) || {}
    r.wait?.cancel()
    r.wait = waiter(dt)
    await r.wait.promise
    r.receipt?.cancel()
    r.receipt = fn.apply(this, args)
    if (!r.receipt) {
      return
    }
    return r.receipt.catch((e) => {
      if (e.message === 'Cancelled') {
        return new Promise(() => {}) // never resolve
      }
      return Promise.reject(e)
    })
  }
}

function concatenate(arrays) {
  let A = arrays[0] ? arrays[0].constructor : Array
  if (A.prototype.set) {
    let totalLength = _sumBy(arrays, (a) => a.length)
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

export const concatResults = (results) => {
  // reassemble
  return concatenate(results)
  // return results.reduce((res, part) => res.concat(part), new A())
}

const timed =
  (fn) =>
  (...args) => {
    let start = performance.now()
    return fn(...args).then((result) => {
      return {
        result,
        duration: performance.now() - start,
      }
    })
  }

export function BatchWorker(factory, concurrency = cpuCores) {
  const workerQueue = createWorkerQueue(factory, concurrency)
  const uuid = Math.random().toString(36).slice(2)

  function destroy() {
    log(`(worker: ${uuid}) Cleanup worker queue`)
    workerQueue.destroy()
  }

  function run(method, args) {
    // sometimes returns null if worker is destroyed
    const maybePromise = workerQueue.enqueue((worker) => worker[method](...args))
    if (maybePromise){ return maybePromise }
    return new Promise(() => {}) // never resolve
  }

  const exec = timed((method, argList) => {
    log(`(worker: ${uuid}) Job (batch) queued ${method}:`, argList)

    const jobs = argList.map((args) => run(method, args))

    const cancel = () => {
      for (let j of jobs) {
        j.cancel()
      }
    }

    const promise = Promise.all(jobs.map((j) => j.promise)).catch((e) => {
      cancel()
      return Promise.reject(e)
    })

    return makeThenable({
      promise,
      cancel,
    })
  })

  function execAndConcat(method, argList) {
    const receipt = exec(method, argList)
    receipt.promise = receipt.promise.then(({ result, duration }) => ({
      result: concatResults(result),
      duration,
    }))
    return receipt
  }

  const execSingle = timed((method, ...args) => {
    log(`(worker: ${uuid}) Job queued ${method}:`, args)
    return run(method, args)
  })

  return {
    exec,
    execAndConcat,
    execSingle,
    partitionSteps: _partialRight(partitionSteps, concurrency),
    destroy,
    length: concurrency,
    uuid,
  }
}

// helper to partition steps
// range = [min, max]
// steps, number of steps to take in that range
// nPartitions number of partitions
export function partitionSteps(range, steps, nPartitions) {
  let x0 = range[0]
  let dx = (range[1] - x0) / (steps - 1)
  let n = (steps / nPartitions) | 0
  let remaining = steps % nPartitions
  return _times(nPartitions, (i) => {
    let steps = n + (i < remaining ? 1 : 0)
    let min = x0 + (i * n + Math.min(i, remaining)) * dx
    let max = min + (steps - 1) * dx
    return {
      range: [min, max],
      count: steps,
    }
  })
}
