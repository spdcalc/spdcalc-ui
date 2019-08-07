<template lang="pug">
.parameter-select
  v-tooltip(:disabled="!tooltip", bottom, open-delay="1000")
    span(v-text="tooltip")
    template(v-slot:activator="{ on }")
      .field(v-on="on")
        v-select(v-model="value", :items="items", outlined)
</template>

<script>
// import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'ParameterSelector'
  , props: {
    propertyGetter: {
      type: String
      , required: true
    }
    , itemsGetter: {
      type: String
      , required: true
    }
    , propertyMutation: {
      type: String
      , required: true
    }
    , tooltip: {
      type: String
    }
  }
  , data: () => ({
  })
  , components: {
  }
  , watch: {
    propertyGetter: {
      handler(){
        if ( !(this.propertyGetter in this.$store.getters) ){
          throw new Error('Can not find getter: ' + this.propertyGetter)
        }
      }
      , immediate: true
    }
    , itemsGetter: {
      handler(){
        if ( !(this.itemsGetter in this.$store.getters) ){
          throw new Error('Can not find getter: ' + this.itemsGetter)
        }
      }
      , immediate: true
    }
  }
  , computed: {
    value: {
      get(){
        let val = this.$store.getters[this.propertyGetter]
        return val
      }
      , set(val){
        this.$store.commit(this.propertyMutation, val)
      }
    }
    , items(){
      return this.$store.getters[this.itemsGetter]
    }
  }
}
</script>

<style lang="sass">
.parameter-select
  color: white
  font-size: 14px

  .label
    display: block
    white-space: nowrap
    // padding: 6px 0
  .v-input
    color: white
    font-size: 14px
    &.v-text-field--outlined
      input
        text-align: right
      fieldset
        border-color: transparent
        background: rgba(0, 0, 0, 0.1)
      &:hover fieldset
        border-color: rgba(255, 255, 255, 0.5)
      &.v-input--is-focused fieldset
        border-color: inherit
        border-width: 1px

      & > .v-input__control > .v-input__slot
        min-height: 32px
        margin-bottom: 4px
        padding: 0 8px
        .v-select__selections
          padding: 0
    .v-text-field__details
      display: none

    .v-input__append-inner
      margin-top: 4px
    .v-input__prepend-outer
      margin-top: 8px
</style>
