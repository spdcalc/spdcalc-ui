import Vue from 'vue'
import vuetify from './plugins/vuetify'
import filters from './plugins/filters'
import App from './App.vue'
import router from './router'
import store from './store'
// import './registerServiceWorker'
import './main.sass'

Vue.config.productionTip = false

Vue.use(filters)

new Vue({
  vuetify
  , router
  , store
  , render: h => h(App)
}).$mount('#app')
