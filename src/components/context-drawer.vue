<template lang="pug">
v-navigation-drawer.drawer.elevation-4(
  v-model="drawerOpen"
  , absolute
  , bottom
  , dark
  , color="blue-grey darken-3"
  , right
  , clipped
  , light
  , width="360"
)
  v-layout(fill-height)
    v-flex(sm12)
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
.drawer
  color: white
</style>
