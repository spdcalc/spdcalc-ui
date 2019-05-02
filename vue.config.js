module.exports = {
  chainWebpack: config => config.resolve.symlinks(false)
  , configureWebpack: {
    module: {
      rules: [{
        type: "javascript/auto"
        , test: /\.wasm$/
        , loaders: ['wasm-loader']
      }]
      // rules: [
      //   {
      //     test: /\.wasm$/,
      //     type: "webassembly/experimental"
      //   }
      // ]
    }
  }
}
