<template lang="pug">
v-navigation-drawer.drawer.elevation-4(
  v-model="drawerOpen"
  , fixed
  , app
  , light
  , right
  , clipped
  , stateless
  , temporary
  , hide-overlay
  , width="360"
)
  v-layout(fill-height)
    v-flex(sm12)
      v-btn(large, text, icon, @click="drawerOpen = false")
        v-icon mdi-close
      p hello
</template>

<script>
export default {
  name: 'ContextDrawer'
  , props: {
  }
  , data: () => ({
    drawerOpen: false
  })
  , components: {
  }
  , computed: {
  }
  , methods: {

  }
}
</script>

<style lang="sass">

</style>
