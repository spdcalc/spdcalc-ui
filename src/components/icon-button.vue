<template lang="pug">
.icon-btn
  .loader
    v-progress-circular.progress(
      v-show="loading"
      , size="16"
      , width="2"
      , indeterminate
    )
  v-tooltip(bottom, :disabled="!tooltip", color="tooltips")
    span(v-text="tooltip")
    template(v-slot:activator="{ on }")
      v-icon(v-show="!loading", v-on="on", @click="$emit('click')", :color="color") {{ icon }}
</template>

<script>
export default {
  name: 'IconButton',
  props: {
    tooltip: String,
    icon: String,
    loading: Boolean,
    color: String,
  },
  data: () => ({}),
}
</script>

<style lang="sass" scoped>
.icon-btn
  display: flex
  .progress
    margin: 2px
</style>
