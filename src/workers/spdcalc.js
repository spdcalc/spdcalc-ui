import { makeWorker } from './make-worker.js'

const worker = makeWorker(new URL('./spdcalc.worker.js', import.meta.url))
// const worker = () => new ComlinkWorker(new URL('./spdcalc.worker.js', import.meta.url))
export default worker
