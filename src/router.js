import Vue from 'vue'
import Router from 'vue-router'
import Main from './views/Main'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/'
      , name: 'home'
      , component: Main
    }
    , {
      path: '/about'
      , name: 'about'
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      , component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    }
    , {
      path: '/benchmarks'
      , name: 'benchmarks'
      , component: () => import(/* webpackChunkName: "benchmarks" */ './views/Benchmarks.vue')
    }
  ]
})
