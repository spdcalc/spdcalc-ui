<template lang="pug">
v-text-field(
  v-model="value"
  , type="number"
  , :label="label"
  , :suffix="units"
  , :readonly="autoCalc"
  , :required="!autoCalc"
  , :messages="autoCalc ? '(auto calculating)' : ''"
)
  template(v-if="this.autoCalcGetter", v-slot:prepend)
    v-icon(
      @click="autoCalc = !autoCalc"
      , :color="autoCalc ? 'blue' : ''"
    ) mdi-auto-fix
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'

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
        let val = this.$store.getters[this.propertyGetter]
        return val * this.conversionFactor
      }
      , set(val){
        let newVal = val / this.conversionFactor
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
  }
  , methods: {
  }
}
</script>
