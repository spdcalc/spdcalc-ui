import { makeWorker } from './make-worker.js'
import SpdcWorker from './spdcalc.worker?worker'

const createWorker = makeWorker(SpdcWorker)
export default createWorker
