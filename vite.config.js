// vite.config.js

import { defineConfig } from 'vite'
import { createVuePlugin as vue } from "vite-plugin-vue2"
import { comlink } from 'vite-plugin-comlink'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    comlink(),
    vue()
  ],
  worker: {
    plugins: [
      comlink()
    ]
  }
})
