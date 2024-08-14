import _pull from 'lodash/pull'

const cpuCores = navigator.hardwareConcurrency || 2

export const makeThenable = (receipt) => {
  receipt.then = (fn, err) => {
    receipt.promise = receipt.promise.then(fn, err)
    return receipt
  }
  receipt.catch = (err) => {
    return receipt.then(null, err)
  }
  return receipt
}

export default function createWorkerQueue(
  createWorker,
  concurrency = cpuCores
) {
  const MAX_WORKERS = concurrency | 0
  const workers = []
  const queue = []
  let isDestroyed = false

  const createWorkerEntry = (index) => {
    const { worker, destroy } = createWorker()
    return {
      worker,
      destroy,
      busy: false,
      promise: Promise.resolve(index),
    }
  }

  const runNextJob = (index) => {
    const entry = workers[index]
    entry.busy = true
    const nextJob = queue.shift()
    entry.promise = new Promise(async (resolve) => {
      entry.resolve = resolve
      try {
        nextJob.runningOn = index
        const result = await nextJob.fn(entry.worker)
        nextJob.resolve(result)
        nextJob.runningOn = null
      } catch (e) {
        nextJob.reject(e)
      } finally {
        entry.busy = false
        resolve(index)
      }
    })
  }

  const processQueue = () => {
    const readyWorker = workers.find((w) => !w.busy)
    if (!readyWorker && workers.length < MAX_WORKERS) {
      const worker = createWorkerEntry(workers.length)
      const index = workers.push(worker) - 1
      runNextJob(index)
      return
    }

    Promise.race(workers.map((w) => w.promise)).then((doneIndex) => {
      if (workers[doneIndex].busy) {
        return processQueue()
      }
      runNextJob(doneIndex)
    })
  }

  const enqueue = (fn) => {
    if (isDestroyed) {
      return
    }
    const receipt = {}
    const job = { fn, runningOn: null }

    receipt.promise = new Promise((resolve, reject) => {
      job.resolve = resolve
      job.reject = reject
      queue.push(job)
      processQueue()
    })
    receipt.cancel = () => {
      receipt.cancel = () => {}
      if (isDestroyed) {
        return
      }
      _pull(queue, job)
      if (job.runningOn !== null) {
        const index = job.runningOn
        const entry = workers[index]
        workers[index] = createWorkerEntry(index)
        entry.destroy()
        entry.resolve(index)
        entry.worker = null
      }
      job.reject(new Error('Cancelled'))
    }
    return makeThenable(receipt)
  }

  const destroy = () => {
    isDestroyed = true
    for (let w of workers) {
      w.destroy()
    }
  }

  return {
    enqueue,
    destroy,
  }
}
