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
      primary: '#4794D5'
      , secondary: '#424242'
      , accent: '#82B1FF'
      , error: '#E34C3C'
      , info: '#2196F3'
      , success: '#4CCB70'
      , warning: '#FFC107'
    }
    , dark: {
      primary: '#4794D5'
      , secondary: '#424242'
      , accent: '#82B1FF'
      , error: '#E34C3C'
      , info: '#2196F3'
      , success: '#4ccb70'
      , warning: '#FFC107'
    }
  }
  , icons: {
    iconfont: 'mdi'
  }
})
