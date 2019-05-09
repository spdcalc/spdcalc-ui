import Vue from 'vue'
// import the .wasm files directly
// import wasmTest from 'wasm-test/wasm_test_bg'

// const extractModule = async (module) => {
//   // NOTE: pass in deps here
//   const { instance } = await module()
//   return instance.exports
// }

const VueWasm = async (vue, options = {}) => {
  Vue.prototype.$wasm = {}
  await Promise.all(
    Object.keys(options.modules)
      .map(async (key) => {
        const mod = await options.modules[key]
        Vue.prototype.$wasm[key] = mod
        return mod
      })
  )
  await Vue.nextTick()
}

export default function(){

  return VueWasm(Vue, {
    modules: {
      wasmTest: import('wasm-test')
    }
  })
}
