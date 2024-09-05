// vite.config.js
import pkg from "./package.json";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import path from "path";
import { VuetifyResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
// import wasm from "vite-plugin-wasm"
// import wasmPack from 'vite-plugin-wasm-pack'
import { ViteRsw } from "vite-plugin-rsw";

const buildVersion = pkg.version;

// https://vitejs.dev/config/
export default defineConfig({
  // base: process.env.NODE_ENV === "production" ? `/${pkg.name}/` : "/",
  define: {
    VITE_SPDCALC_BUILD_VERSION: JSON.stringify(buildVersion),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~": path.resolve(__dirname, "node_modules"),
    },
  },
  css: {
    preprocessorOptions: {
      sass: {
        additionalData: `@import "@/variables.scss"\n`,
      },
    },
  },
  plugins: [
    ViteRsw(),
    vue(),
    Components({
      resolvers: [
        // Vuetify
        VuetifyResolver(),
      ],
    }),
  ],
  worker: {
    // type: 'es',
    plugins: [ViteRsw()],
  },
});
