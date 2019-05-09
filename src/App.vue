<template lang="pug">
v-app
  v-navigation-drawer(v-model='drawer' app clipped)
    v-list(dense)
      v-list-tile(:to="{name: 'home'}")
        v-list-tile-action
          v-icon home
        v-list-tile-content
          v-list-tile-title Home
      v-list-tile(:to="{name: 'about'}")
        v-list-tile-action
          v-icon info
        v-list-tile-content
          v-list-tile-title About
  v-toolbar(dark app clipped-left)
    v-toolbar-side-icon(@click.stop='drawer = !drawer')
    v-toolbar-title SPDCalc
  v-content
    v-container(fluid)
      v-layout(justify-center align-center)
        router-view
    v-footer(dark)
      span.white--text &copy; 2017
</template>

<script>
// import * as wasmTest from 'wasm-test/wasm_test_bg.wasm'

export default {
  name: 'App'
  , data: () => ({
    drawer: null
  })
}
</script>
