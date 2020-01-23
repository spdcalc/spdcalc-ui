<template lang="pug">
.parameter-select
  v-tooltip(:disabled="!tooltip", bottom, open-delay="1000", color="tooltips")
    span(v-text="tooltip")
    template(v-slot:activator="{ on }")
      .field(v-on="on")
        v-select(v-model="propVal", :items="itemsList", outlined)
</template>

<script>
// import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'ParameterSelector'
  , props: {
    items: {
      type: Array
    }
    , value: {}
    , propertyGetter: {
      type: String
    }
    , itemsGetter: {
      type: String
    }
    , propertyMutation: {
      type: String
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
        if ( this.propertyGetter && !(this.propertyGetter in this.$store.getters) ){
          throw new Error('Can not find getter: ' + this.propertyGetter)
        }
      }
      , immediate: true
    }
    , itemsGetter: {
      handler(){
        if ( !this.items && !(this.itemsGetter in this.$store.getters) ){
          throw new Error('Can not find getter: ' + this.itemsGetter)
        }
      }
      , immediate: true
    }
  }
  , computed: {
    propVal: {
      get(){
        let val = this.propertyGetter ? this.$store.getters[this.propertyGetter] : this.value
        return val
      }
      , set(val){
        if ( this.propertyMutation ){
          this.$store.commit(this.propertyMutation, val)
        }

        this.$emit('input', val)
      }
    }
    , itemsList(){
      return this.items || this.$store.getters[this.itemsGetter]
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
        margin-bottom: 0px
        padding: 0 8px
        .v-select__selections
          padding: 0
    .v-text-field__details
      display: none

    .v-input__append-inner
      margin-top: 4px
    .v-input__prepend-outer
      margin-top: 8px

.v-menu__content
  &::-webkit-scrollbar
    -webkit-appearance: none
    width: 7px
  &::-webkit-scrollbar-track
    background: map-get($flat-ui, 'silver')
  &::-webkit-scrollbar-thumb
    border-radius: 4px
    background-color: map-get($flat-ui, 'belize-hole')
</style>
