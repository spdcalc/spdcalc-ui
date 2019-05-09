import Vue from 'vue'

const VueWasm = async (vue, options = {}) => {
  Vue.prototype.$wasm = {}
  await Promise.all(
    Object.keys(options.modules)
      .map(async (key) => {
        const mod = await options.modules[key]
        Vue.prototype.$wasm[key] = mod

        if ( process.env.NODE_ENV !== 'production' && mod.browser_debug ){
          console.log('DEBUG: setting panic hook')
          mod.browser_debug()
        }
        return mod
      })
  )
  await Vue.nextTick()
}

export default function( config = {} ){
  return VueWasm(Vue, config)
}
