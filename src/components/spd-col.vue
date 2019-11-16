<template lang="pug">
v-col(v-bind="sizes")
  slot
</template>

<script>
export default {
  name: 'SPDCol'
  , props: {
    size: {
      type: [Number, String]
      , default: 1
    }
  }
  , computed: {
    sizes(){
      return {
        xl: Math.min(12, this.size * 4)
        , lg: Math.min(12, this.size * 6)

        , md: 12
        , sm: 12
        , xs: 12
      }
    }
  }
}
</script>
