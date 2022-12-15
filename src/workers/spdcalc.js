export default class CreateWorker extends ComlinkWorker {
  constructor(){
    super(new URL('./spdcalc.worker.js', import.meta.url), {/* normal Worker options*/ })
  }
}
