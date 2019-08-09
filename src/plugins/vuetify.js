import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
// import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

export default new Vuetify({
  dark: true
  , themes: {
    light: {
      primary: '#3398db'
      , blue: '#3398db'
      , secondary: '#424242'
      , accent: '#82B1FF'
      , error: '#E34C3C'
      , info: '#2196F3'
      , success: '#4CCB70'
      , warning: '#FFC107'
    }
    , dark: {
      primary: '#3398db'
      , blue: '#3398db'
      , secondary: '#424242'
      , accent: '#82B1FF'
      , error: '#E34C3C'
      , info: '#2196F3'
      , success: '#4ccb70'
      , warning: '#FFC107'
    }
  }
  , breakpoint: {
    thresholds: {
      // end at...
      xs: 568
      , sm: 768
      , md: 1280
      , lg: 1920
    }
    , scrollBarWidth: 0
  }
  , icons: {
    iconfont: 'mdi'
  }
})
