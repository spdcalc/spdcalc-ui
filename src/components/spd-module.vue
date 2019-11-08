<template lang="pug">
v-card.spd-module
  v-toolbar(flat, dark, color="blue-grey darken-2", dense, :extension-height="toolbarHeight")
    v-toolbar-title {{ title }}
    v-spacer
    slot(name="main-toolbar")
    v-btn(
      @click="$emit('refresh')"
      , :loading="loading"
      , icon
    )
      v-icon mdi-refresh
    v-btn(
      icon
      , color="red lighten-1"
      , @click="$emit('remove')"
    )
      v-icon mdi-close
    template(v-if="$slots['secondary-toolbar']", #extension)
      .flex-column.flex-wrap
        slot(name="secondary-toolbar")
  slot
</template>

<script>
export default {
  name: 'SPDModule'
  , props: {
    title: {
      type: String
    }
    , loading: Boolean
    , toolbarRows: {
      type: [Number, String]
      , default: 1
    }
  }
  , data: () => ({
  })
  , computed: {
    toolbarHeight(){
      return this.$slots['secondary-toolbar'] ? this.toolbarRows * 38 : 0
    }
  }
  , mounted(){
  }
}
</script>

<style lang="sass" scoped>
.spd-module
  >>> .switch
    padding: 0px 8px
    align-items: center
    .v-input__slot
      margin-bottom: 0
    .v-messages
      display: none
  >>> .v-toolbar__content .v-btn.v-btn--icon
    height: 40px
    width: 40px
  >>> .props-toolbar
    height: 38px
    justify-content: space-between
    > *
      margin-left: 6px
      &:first-child
        margin-left: inherit
</style>
