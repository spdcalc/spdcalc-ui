// vite.config.js

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { comlink } from 'vite-plugin-comlink'
import path from 'path'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
// import wasm from "vite-plugin-wasm"
// import wasmPack from 'vite-plugin-wasm-pack'
import { ViteRsw } from 'vite-plugin-rsw'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, 'node_modules')
    }
  },
  css: {
    preprocessorOptions: {
      sass: {
        additionalData: `@import "@/variables.scss"\n`
      }
    }
  },
  plugins: [
    // wasm(),
    // wasmPack('./src/spdcalcwasm'),
    ViteRsw(),
    comlink(),
    vue(),
    Components({
      resolvers: [
        // Vuetify
        VuetifyResolver()
      ]
    })
  ],
  worker: {
    plugins: [
      // wasm(),
      // wasmPack('./src/spdcalcwasm'),
      ViteRsw(),
      comlink()
    ]
  }
})
