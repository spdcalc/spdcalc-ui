const path = require('path')
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')

module.exports = {
  chainWebpack: config => config.resolve.symlinks(false)
  , configureWebpack: {
    plugins: [
      new WasmPackPlugin({
          crateDirectory: path.resolve(__dirname, '.')
          , watchDirectories: [
            path.resolve(__dirname, '.')
          ]
      })
    ]
    , module: {
      // rules: [{
      //   type: "javascript/auto"
      //   , test: /\.wasm$/
      //   , loaders: ['wasm-loader']
      // }]
      // rules: [
      //   {
      //     test: /\.wasm$/,
      //     type: "webassembly/experimental"
      //   }
      // ]
    }
  }
}
