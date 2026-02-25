import Promise from 'bluebird'
import Vue from 'vue'
import vuetify from './plugins/vuetify'
import filters from './plugins/filters'
import App from './App.vue'
import router from './router'
import store from './store'
import createAppStateManager from './plugins/app-state/app-state-manager'
// import './registerServiceWorker'
import './main.sass'

Promise.config({
  warnings: process.env.NODE_ENV === 'development'
  , longStackTraces: process.env.NODE_ENV === 'development'
  , monitoring: process.env.NODE_ENV === 'development'
  // enable cancelation abilities of promises
  , cancellation: true
})

Vue.config.productionTip = false

Vue.use(filters)

createAppStateManager(store, router)

new Vue({
  vuetify
  , router
  , store
  , render: h => h(App)
}).$mount('#app')
