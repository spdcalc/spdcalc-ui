<template lang="pug">
v-snackbar(v-model="show", color="error", :multi-line="true", :right="true", :bottom="true", :timeout="alert.timeout")
  .msg
    strong {{ alert.context ? `Error ${alert.context}:` : 'Error:' }}
    br/
    | {{ alert.error.message }}
  v-btn(
    text
    , @click="show = false"
  ) dismiss
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'ErrorMessage'
  , props: {
    alert: {
      type: Object
    }
  }
  , data: () => ({
  })
  , components: {
  }
  , computed: {
    show: {
      get(){
        return !!this.alert
      }
      , set( v ){
        if ( !v ){
          let id = this.alert.id
          this.clearError({ id })
        }
      }
    }
  }
  , methods: {
    ...mapActions([
      'clearError'
    ])
  }
}
</script>
