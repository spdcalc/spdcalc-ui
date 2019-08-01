<template lang="pug">
v-snackbar(v-model="show", color="info", :multi-line="true", :right="true", :bottom="true", :timeout="alert.timeout")
  .msg
    | {{ alert.message }}
  v-btn(
    text
    , @click="show = false"
  ) dismiss
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'InfoMessage'
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
          this.clearInfo({ id })
        }
      }
    }
  }
  , methods: {
    ...mapActions([
      'clearInfo'
    ])
  }
}
</script>
