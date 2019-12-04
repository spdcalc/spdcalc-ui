import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import _mapKeys from 'lodash/mapKeys'
import _kebabCase from 'lodash/kebabCase'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
// import 'vuetify/dist/vuetify.min.css'
import colors from '@/lib/flat-ui-colors'

const light = {
  ..._mapKeys(colors, (v, k) => _kebabCase(k))
  , primary: colors.belizeHole
  , secondary: colors.darkGrey
  , accent: colors.turquoise
  , error: colors.red
  , info: colors.blue
  , success: colors.nephritis
  , warning: colors.orange
}
const dark = light
const themes = {
  light
  , dark
}

Vue.use(Vuetify)

export default new Vuetify({
  dark: true
  , theme: { themes }
  , breakpoint: {
    thresholds: {
      // end at...
      xs: 0 // 568
      , sm: 768
      , md: 1124
      , lg: 1920
    }
    , scrollBarWidth: 0
  }
  , icons: {
    iconfont: 'mdi'
  }
})
