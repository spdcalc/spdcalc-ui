import Vue from 'vue'
import vuetify from './plugins/vuetify'
import loadWasm from './plugins/vue-wasm'
import App from './App.vue'
import router from './router'
import store from './store'
// import './registerServiceWorker'
import './main.sass'

Vue.config.productionTip = false

loadWasm({
  modules: {
    // spdcalc: import('spdcalc')
    // , wasmTest: import('wasm-test')
  }
}).then(() => {
  new Vue({
    vuetify
    , router
    , store
    , render: h => h(App)
  }).$mount('#app')
})
