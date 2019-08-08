import Promise from 'bluebird'
import Vue from 'vue'
import vuetify from './plugins/vuetify'
import filters from './plugins/filters'
import App from './App.vue'
import router from './router'
import store from './store'
import parameterHashStorage from './plugins/parameter-hash-storage'
// import './registerServiceWorker'
import './main.sass'

Promise.config({
  warnings: process.env.NODE_ENV === 'development'
  , longStackTraces: process.env.NODE_ENV === 'development'
  , monitoring: process.env.NODE_ENV === 'development'
  // enable cancelation abilities of promises
  , cancellation: false
})

Vue.config.productionTip = false

Vue.use(filters)

// init location hash storage for parameters
parameterHashStorage(store, router)

new Vue({
  vuetify
  , router
  , store
  , render: h => h(App)
}).$mount('#app')
