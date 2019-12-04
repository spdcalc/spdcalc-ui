<template lang="pug">
.parameter-input(:class="{ left, active }")
  v-tooltip(:disabled="!tooltip && !errorMsg", bottom, :value="errorMsg", :color="errorMsg ? 'error' : 'tooltips'", open-delay="1000")
    span(v-text="errorMsg || tooltip")
    span(v-if="autoCalc")  (auto-calculating)
    template(v-slot:activator="{ on }")
      .field(v-on="on")
        v-text-field(
          v-model.trim="displayVal"
          , :type="displayOverride || exponential ? 'text' : 'number'"
          , :id="uid"
          , :name="uid"
          , outlined
          , :color="computedColor"
          , :suffix="units"
          , :readonly="autoCalc"
          , :required="!autoCalc"
          , :disabled="disabled"
          , :read-only="autoCalc"
          , :error="error || !!errorMsg"
          , :step="step"
          , :min="min"
          , :max="max"
          , :autocomplete="false"
          , novalidate
          , @focus="startEditing"
          , @blur="doneEditing"
          , @keyup.enter="doneEditing"
          , @keydown.enter="active = true"
          , @keydown.up="increase"
          , @keydown.down="decrease"
          , @keydown.16="shiftPressed = true"
          , @keyup.16="shiftPressed = false"
        )
          template(v-if="label", v-slot:prepend-inner)
            label.label(:for="uid") {{ label }}:
          template(v-if="autoCalcGetter", v-slot:append)
            .autocalc
              v-icon(
                size="18"
                , @click="autoCalc = !autoCalc"
                , :color="disabled ? 'grey' : autoCalc ? 'yellow' : ''"
              ) mdi-auto-fix
          template(v-if="append", v-slot:append-outer)
            span {{ append }}
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
    }
    , value: {}
    , lazy: {
      type: Boolean
    }
    , units: {
      type: String
    }
    , append: {
      type: String
    }
    , propertyGetter: {
      type: String
    }
    , propertyMutation: {
      type: String
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
    , sigfigs: {
      type: Number
    }
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
    , left: {
      type: Boolean
    }
    , exponential: {
      type: Boolean
    }
    , min: Number
    , max: Number
  }
  , data: () => ({
    uid: _uniqueId('spd-input')
    , oldVal: 0
    , active: false
    , shiftPressed: false
    , editing: false
    , displayVal: 0
    , errorMsg: null
  })
  , components: {
  }
  , watch: {
    propertyGetter: {
      handler(){
        if (this.propertyGetter && !this.displayOverride && !(this.propertyGetter in this.$store.getters) ){
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
    , 'editing': 'updateDisplay'
    , 'propVal': 'updateDisplay'
  }
  , created(){
    this.updateDisplay()
    this.$watch('displayVal', (val, oldVal) => {
      if (val === oldVal){ return }
      val = +val
      this.errorMsg = null
      if (this.min !== undefined && val < this.min){
        this.errorMsg = 'Value is too small'
        return
      }
      if (this.max !== undefined && val > this.max){
        this.errorMsg = 'Value is too large'
        return
      }
      this.propVal = val
    })
  }
  , computed: {
    step(){
      let figs = this.sigfigs | 0
      if ( this.shiftPressed ){
        if ( !figs ){ return '10' }
        return '1'
      }

      if ( !figs ){ return '1' }

      let zeros = Array(figs).join('0')
      return `0.${zeros}1`
    }
    , propVal: {
      get(){
        if ( (this.disabled || this.autoCalc) && this.displayOverride ){
          return this.displayOverride
        }

        let val = this.propertyGetter ? this.$store.getters[this.propertyGetter] : this.value
        let newVal = val * this.conversionFactor
        if ( Math.abs(newVal - this.oldVal) < epsilon ){
          newVal = this.oldVal
        }

        return newVal
      }
      , set(val){
        let newVal = val / this.conversionFactor
        this.oldVal = val
        this.newVal = newVal

        if ( this.lazy ){ return }

        if ( this.propertyMutation ){
          this.$store.commit(this.propertyMutation, newVal)
        }

        this.$emit('input', newVal)
      }
    }
    , autoCalc: {
      get(){
        if ( !this.autoCalcGetter ) return false
        return this.$store.getters[this.autoCalcGetter]
      }
      , set(val){
        if ( val ){ this.doneEditing() }
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
    updateDisplay(force){
      if ( force !== true && this.editing ){ return }
      let val = this.propVal

      if ( this.exponential ){
        this.displayVal = val.toExponential(this.sigfigs)
      } else if ( this.sigfigs !== undefined && val.toFixed ){
        this.displayVal = val.toFixed(this.sigfigs)
      } else {
        this.displayVal = val
      }
    }
    , startEditing(){
      if ( !this.propertyMutation || this.autoCalc ){ return }
      this.editing = true
    }
    , doneEditing(){
      this.active = false
      this.editing = false
      if ( this.newVal !== undefined ){
        if ( this.propertyMutation ){
          this.$store.commit(this.propertyMutation, this.newVal)
        }

        this.$emit('input', this.newVal)
        this.newVal = undefined
      }
    }
    , increase(e){
      this.editing = false
      if ( this.exponential ){
        e.preventDefault()
        this.propVal *= 10
        this.updateDisplay(true)
      }
    }
    , decrease(e){
      this.editing = false
      if ( this.exponential ){
        e.preventDefault()
        this.propVal /= 10
        this.updateDisplay(true)
      }
    }
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
      transition: background 0.3s ease
    &:hover fieldset
      border-color: rgba(255, 255, 255, 0.5)

    & > .v-input__control > .v-input__slot
      min-height: 32px
      margin-bottom: 0px
      padding: 0 8px
    .v-text-field__details
      display: none

    .v-input__append-inner
      margin-top: 7px
      margin-right: -4px
    .v-input__prepend-inner,
    .v-input__prepend-outer
      margin-top: 9px
      padding-right: 8px,
    .v-input__append-outer
      margin: 9px 4px 0

    &.v-input--is-focused fieldset
      border-color: inherit
      border-width: 1px
    &.v-input--is-readonly,
    &.v-input--is-disabled
      color: map-get($flat-ui, 'silver')
      input
        color: map-get($flat-ui, 'silver')
      .v-text-field__slot,
      .v-text-field__slot .v-text-field__suffix,
      .v-input__append-inner,
      .v-input__append-outer,
      .v-input__prepend-inner,
      .v-input__prepend-outer,
      .v-text-field__suffix
        color: map-get($flat-ui, 'silver')
  &.left .v-input input
    text-align: left
  &.active .v-input fieldset
    transition: none
    background: rgba(0, 0, 0, 0.3)
</style>
