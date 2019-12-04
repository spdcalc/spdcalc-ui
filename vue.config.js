const path = require('path')
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/spdcalc-ui/'
    : '/',

  chainWebpack: config => config.resolve.symlinks(false),
  css: {
    loaderOptions: {
      sass: {
        data: `@import "~@/variables.scss"`,
      },
    },
  },
  configureWebpack: {
    plugins: [
      new WasmPackPlugin({
          crateDirectory: path.resolve(__dirname, 'src/wasm')
          , watchDirectories: [
            path.resolve(__dirname, 'src/wasm/src')
          ]
          , forceMode: 'production'
      })
      , new VuetifyLoaderPlugin()
    ]
    , output: {
      globalObject: 'this'
    }
    , module: {
      rules: [
        {
          test: /\.js$/
          , use: [
            'ify-loader'
            , 'transform-loader?plotly.js/tasks/compress_attributes.js'
          ]
        },{
          test: /\.js$/
          , use: [
            'comlink-loader'
          ]
          , include: [ path.resolve(__dirname, 'src/workers') ]
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
