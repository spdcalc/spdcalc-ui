<template lang="pug">
.app-messages
  v-snackbar(v-model="showErrors", color="error", :multi-line="true", :right="true", :bottom="true", :timeout="0")
    .msg
      template(v-for="(entry, index) in errors")
        br(v-if="index != 0")
        br(v-if="index != 0")
        strong {{ entry.context ? `Error ${entry.context}:` : 'Error:' }}
        br/
        | {{ entry.error.message }}
    v-btn(
      text
      , @click="showErrors = false"
    ) dismiss
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppMessages'
  , props: {
  }
  , data: () => ({
  })
  , components: {
  }
  , computed: {
    showErrors: {
      get(){
        return this.hasError
      }
      , set( v ){
        if ( !v ){
          this.clearErrors()
        }
      }
    }
    , ...mapGetters([
      'hasError'
      , 'errors'
    ])
  }
  , methods: {
    ...mapActions([
      'clearErrors'
    ])
  }
}
</script>
