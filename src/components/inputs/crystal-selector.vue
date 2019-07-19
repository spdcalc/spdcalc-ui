<template lang="pug">
v-select(v-model="crystalName", :items="crystalTypes", label="Crystal Type")
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'CrystalSelector'
  , props: {
  }
  , data: () => ({
  })
  , components: {
  }
  , computed: {
    crystalName: {
      get(){
        return this.crystal
      }
      , set(val){
        this.setCrystal(val)
      }
    }
    , ...mapGetters('parameters', [
      'crystalTypes'
      , 'crystal'
    ])
  }
  , methods: {
    ...mapMutations('parameters', [
      'setCrystal'
    ])
  }
}
</script>
