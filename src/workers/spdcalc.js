
export default function worker() {
  return new ComlinkWorker(
    new URL('./spdcalc.worker.js', import.meta.url),
    {/* normal Worker options*/ }
  )
}
