<template lang="pug">
v-dialog(v-model="isOpen", width="500")
  v-card
    v-card-title
      span Export Settings
    v-card-text
      v-textarea(:value="json", readonly, outlined, rows="20", @focus="copyJsonToClipboard")
    v-card-actions
      v-spacer
      v-btn(color="primary", text, @click="isOpen = false")
        span Close
</template>

<script>
export default {
  name: 'ExportSettings'
  , props: {
    value: {
      type: Boolean
      , default: false
    }
  }
  , data: () => ({
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
    },
    json(){
      return this.$store.getters['parameters/json']
    }
  }
  , methods: {
    copyJsonToClipboard(){
      try {
        navigator.clipboard.writeText(this.json)
        this.$store.dispatch('info', { message: 'Copied to clipboard', timeout: 2000 })
      } catch (err) {
        this.$store.dispatch('error', { error: err })
      }
    }
  }
}
</script>

<style lang="sass">
</style>
