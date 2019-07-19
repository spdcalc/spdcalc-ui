<template lang="pug">
v-select(v-model="pmTypeVal", :items="pmTypes", label="Phasematch Type")
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'PmTypeSelector'
  , props: {
  }
  , data: () => ({
  })
  , components: {
  }
  , computed: {
    pmTypeVal: {
      get(){
        return this.pmType
      }
      , set(val){
        this.setPmType(val)
      }
    }
    , ...mapGetters('parameters', [
      'pmTypes'
      , 'pmType'
    ])
  }
  , methods: {
    ...mapMutations('parameters', [
      'setPmType'
    ])
  }
}
</script>
