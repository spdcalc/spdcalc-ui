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
      rules: [
        {
          test: /\.js$/
          , use: [
            'ify-loader'
            , 'transform-loader?plotly.js/tasks/compress_attributes.js'
          ]
        }
        // , {
        //   type: "javascript/auto"
        //   , test: /\.wasm$/
        //   , loaders: ['wasm-loader']
        // }
        // , {
        //   test: /\.wasm$/,
        //   type: "webassembly/experimental"
        // }
      ]
    }
  }
}
