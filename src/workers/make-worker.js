import { wrap, releaseProxy } from 'comlink'

export const makeWorker = (WorkerClass) => () => {
  const worker = new WorkerClass()
  const proxy = wrap(worker)
  const api = { worker: proxy }
  api.destroy = async () => {
    await worker.terminate()
    proxy[releaseProxy]()
    api.worker = null
  }
  return api
}
