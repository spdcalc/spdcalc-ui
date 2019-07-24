import Vue from 'vue'
import Vuetify from 'vuetify'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

export default new Vuetify({
  dark: true
  , themes: {
    light: {
      primary: '#ee44aa'
      , secondary: '#424242'
      , accent: '#82B1FF'
      , error: '#FF5252'
      , info: '#2196F3'
      , success: '#4CAF50'
      , warning: '#FFC107'
    }
    , dark: {
      primary: '#ee44aa'
      , secondary: '#424242'
      , accent: '#82B1FF'
      , error: '#FF5252'
      , info: '#2196F3'
      , success: '#4CAF50'
      , warning: '#FFC107'
    }
  }
  , icons: {
    iconfont: 'mdi'
  }
})
