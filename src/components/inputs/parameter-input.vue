<template lang="pug">
.parameter-input
  v-tooltip(:disabled="!tooltip", bottom, open-delay="1000")
    span(v-text="tooltip")
    template(v-slot:activator="{ on }")
      .field(v-on="on")
        v-text-field(
          v-model="value"
          , :id="uid"
          , :name="uid"
          , outlined
          , :type="displayOverride ? 'text' : 'number'"
          , :color="computedColor"
          , :suffix="units"
          , :readonly="autoCalc"
          , :required="!autoCalc"
          , :disabled="disabled"
          , :read-only="autoCalc"
          , :error="error"
          , step="1e-16"
        )
          template(v-slot:prepend-inner)
            label.label(:for="uid") {{ label }}:
          template(v-if="autoCalcGetter", v-slot:append)
            .autocalc
              v-icon(
                size="18"
                , @click="autoCalc = !autoCalc"
                , :color="disabled ? 'grey' : autoCalc ? 'blue' : ''"
              ) mdi-auto-fix
</template>

<script>
import _uniqueId from 'lodash/uniqueId'
// import { mapMutations, mapGetters } from 'vuex'

const epsilon = Math.sqrt(Number.EPSILON)

export default {
  name: 'ParameterInput'
  , props: {
    label: {
      type: String
      , default: 'Field'
    }
    , units: {
      type: String
    }
    , propertyGetter: {
      type: String
      , required: true
    }
    , propertyMutation: {
      type: String
      , required: true
    }
    , autoCalcGetter: {
      type: String
    }
    , autoCalcMutation: {
      type: String
    }
    , conversionFactor: {
      type: Number
      , default: 1
    }
    , step: {}
    , disabled: {
      type: Boolean
    }
    , displayOverride: {
      type: String
    }
    , error: {
      type: Boolean
    }
    , tooltip: {
      type: String
    }
  }
  , data: () => ({
    uid: _uniqueId('spd-input')
    , oldVal: 0
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
    , autoCalcGetter: {
      handler(){
        if ( this.autoCalcGetter && !(this.autoCalcGetter in this.$store.getters) ){
          throw new Error('Can not find getter: ' + this.autoCalcGetter)
        }
      }
      , immediate: true
    }
  }
  , computed: {
    value: {
      get(){
        if ( (this.disabled || this.autoCalc) && this.displayOverride ){
          return this.displayOverride
        }

        let val = this.$store.getters[this.propertyGetter]
        let newVal = val * this.conversionFactor
        if ( Math.abs(newVal - this.oldVal) < epsilon ){
          return this.oldVal
        }

        return newVal
      }
      , set(val){
        let newVal = val / this.conversionFactor
        this.oldVal = val
        this.$store.commit(this.propertyMutation, newVal)
      }
    }
    , autoCalc: {
      get(){
        if ( !this.autoCalcGetter ) return false
        return this.$store.getters[this.autoCalcGetter]
      }
      , set(val){
        this.$store.commit(this.autoCalcMutation, val)
      }
    }
    , computedColor(){
      if ( this.error ){ return 'error' }
      if ( this.autoCalc ){ return 'grey' }
      return ''
    }
  }
  , methods: {
  }
}
</script>

<style lang="sass">
.parameter-input
  font-size: 14px

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button
    -webkit-appearance: none
    margin: 0

  .label
    display: block
    white-space: nowrap
    // padding: 6px 0
  .v-input
    color: white
    font-size: 14px
    input
      text-align: right
    fieldset
      border-color: transparent
      background: rgba(0, 0, 0, 0.1)
    &:hover fieldset
      border-color: rgba(255, 255, 255, 0.5)

    & > .v-input__control > .v-input__slot
      min-height: 32px
      margin-bottom: 4px
      padding: 0 8px
    .v-text-field__details
      display: none

    .v-input__append-inner
      margin-top: 7px
      margin-right: -4px
    .v-input__prepend-inner,
    .v-input__prepend-outer
      margin-top: 9px
      padding-right: 8px

    &.v-input--is-focused fieldset
      border-color: inherit
      border-width: 1px
    &.v-input--is-readonly,
    &.v-input--is-disabled
      color: map-get($grey, 'base')
      input
        color: map-get($grey, 'base')
      .v-text-field__slot,
      .v-text-field__slot .v-text-field__suffix,
      .v-input__append-inner,
      .v-input__prepend-inner,
      .v-input__prepend-outer,
      .v-text-field__suffix
        color: map-get($grey, 'base')

</style>
