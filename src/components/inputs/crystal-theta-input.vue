<template lang="pug">
v-text-field(
  v-model="theta"
  , type="number"
  , label="Theta"
  , suffix="degrees"
  , :readonly="autoCalc"
  , :required="!autoCalc"
  , :messages="autoCalc ? '(auto calculating)' : ''"
)
  template(v-slot:prepend)
    v-icon(
      @click="autoCalc = !autoCalc"
      , :color="autoCalc ? 'blue' : ''"
    ) mdi-auto-fix
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
const deg = 180 / Math.PI

export default {
  name: 'CrystalThetaInput'
  , props: {
  }
  , data: () => ({
  })
  , components: {
  }
  , computed: {
    theta: {
      get(){
        return this.crystalTheta * deg
      }
      , set(val){
        this.setCrystalTheta(val / deg)
      }
    }
    , autoCalc: {
      get(){
        return this.autoCalcTheta
      }
      , set(val){
        this.setAutocalcTheta( val )
      }
    }
    , ...mapGetters('parameters', [
      'crystalTheta'
      , 'autoCalcTheta'
    ])
  }
  , methods: {
    ...mapMutations('parameters', [
      'setCrystalTheta'
      , 'setAutocalcTheta'
    ])
  }
}
</script>
