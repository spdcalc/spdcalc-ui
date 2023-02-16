import { wrap, releaseProxy } from 'comlink'

export const killWorker = Symbol('killWorker')

export const makeWorker = (urlObj) => () => {
  // hack to wrap it myself so i can add a way to terminate the worker
  // https://github.com/mathe42/vite-plugin-comlink/blob/main/src/index.ts#L7
  const worker = new Worker(
    urlObj,
    { type: 'module' }
  )
  const proxy = wrap(worker)
  // TODO: need to figure out a better way
  // console.log(proxy)
  const api = { worker: proxy }
  api.destroy = async () => {
    await worker.terminate()
    proxy[releaseProxy]()
    api.worker = null
  }
  return api
}
