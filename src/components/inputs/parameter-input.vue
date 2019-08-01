<template lang="pug">
v-text-field(
  v-model="value"
  , type="text"
  , :color="computedColor"
  , :label="label"
  , :suffix="units"
  , :readonly="autoCalc"
  , :required="!autoCalc"
  , :disabled="disabled"
  , :read-only="autoCalc"
  , :step="step"
  , :hint="hint"
  , :persistent-hint="true"
  , :error="error"
)
  template(v-if="this.autoCalcGetter", v-slot:append)
    .autocalc
      .lbl(:class="disabled ? 'grey--text' : autoCalc ? 'blue--text' : ''") auto-calc
      v-icon(
        @click="autoCalc = !autoCalc"
        , :color="disabled ? 'grey' : autoCalc ? 'blue' : ''"
      ) {{ disabled ? 'mdi-minus-box-outline' : autoCalc ? 'mdi-checkbox-intermediate' : 'mdi-checkbox-blank-outline' }}
</template>

<script>
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
    , hint: {
      type: String
    }
    , displayOverride: {
      type: String
    }
    , error: {
      type: Boolean
    }
  }
  , data: () => ({
    oldVal: 0
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

<style lang="sass" scoped>
.autocalc
  position: relative
  .lbl
    position: absolute
    top: -1rem
    right: 0
    width: 4rem
    font-size: 0.75rem
    text-align: right
</style>
