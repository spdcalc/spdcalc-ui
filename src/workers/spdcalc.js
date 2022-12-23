import { makeWorker } from './make-worker.js'

const worker = makeWorker(new URL(`internal:comlink:./spdcalc.worker.js`, import.meta.url))
export default worker
