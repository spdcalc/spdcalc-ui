<template lang="pug">
.parameter-activator
  v-tooltip(:disabled="!tooltip", bottom, open-delay="1000", color="tooltips")
    span(v-text="tooltip")
    template(v-slot:activator="{ on }")
      .field(v-on="on")
        v-checkbox(v-model="value", color="yellow")
          template(v-slot:prepend)
            span {{ label }}
</template>

<script>
// import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'ParameterActivator'
  , props: {
    label: {
      type: String
      , default: 'Field'
    }
    , propertyGetter: {
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
  }
}
</script>

<style lang="sass">
.parameter-activator
  .v-input
    margin-top: 0
    padding: 4px 0

    &,
    .v-icon
      color: map-get($flat-ui, 'silver')
    .v-label,
    .v-input__prepend-outer
      font-size: 14px
    .v-input__slot
      margin-bottom: 0
    .v-messages
      display: none
    .v-input__prepend-outer
      margin-top: 4px
    .v-input__control
      flex-grow: 0
      width: auto
</style>
