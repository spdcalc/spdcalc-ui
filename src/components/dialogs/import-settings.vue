<template lang="pug">
v-dialog(v-model="isOpen", width="500")
  v-card
    v-card-title
      span Import Settings (json)
    v-card-text
      v-textarea(v-model="json", outlined, rows="20")
    v-card-actions
      v-spacer
      v-btn(color="secondary", text, @click="isOpen = false")
        span Cancel
      v-btn(color="primary", text, @click="importSettings")
        span Import
</template>

<script>
export default {
  name: 'ImportSettings'
  , props: {
    value: {
      type: Boolean
      , default: false
    }
  }
  , data: () => ({
    json: ''
  })
  , components: {
  }
  , computed: {
    isOpen: {
      get(){
        return this.value
      }
      , set(val){
        this.$emit('input', val)
      }
    }
  }
  , methods: {
    async importSettings(){
      await this.$store.dispatch('parameters/importJson', this.json)
      this.$emit('input', false)
    }
  }
}
</script>

<style lang="sass">
</style>
