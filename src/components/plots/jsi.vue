<template lang="pug">
v-card.jsi
  v-toolbar(flat, dark, color="blue-grey darken-2")
    v-toolbar-title JSI
    v-spacer
    v-toolbar-items
      v-switch.switch(v-model="enableLogScale", label="Log Scale", color="yellow")
    v-btn(
      @click="redraw"
      , :loading="isLoading"
      , icon
    )
      v-icon mdi-refresh
    v-btn(
      icon
      , color="red lighten-1"
      , @click="$emit('remove')"
    )
      v-icon mdi-close
  Histogram(
    :chart-data="data"
    , :axes="axes"
    , :log-scale="enableLogScale"
    , x-title="Signal wavelength (nm)"
    , y-title="Idler wavelength (nm)"
  )
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Histogram from '@/components/plots/histogram'

export default {
  name: 'jsa'
  , data: () => ({
    enableLogScale: false
  })
  , components: {
    Histogram
  }
  , computed: {
    axes(){
      let cfg = this.integrationConfig
      let x0 = cfg.ls_min
      let dx = (cfg.ls_max - x0) / (cfg.size - 1)
      let y0 = cfg.li_min
      let dy = (cfg.li_max - y0) / (cfg.size - 1)
      return {
        x0
        , dx
        , y0
        , dy
      }
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
    , ...mapGetters('plots/jsi', [
      'data'
      , 'isLoading'
    ])
  }
  , mounted(){
    const unwatch = this.$store.watch(
      (state, getters) => getters['parameters/isReady'] &&
        !getters['parameters/isEditing'] &&
        ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , ( refresh ) => refresh && this.redraw()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
    })
  }
  , methods: {
    redraw(){
      this.calculate()
    }
    , ...mapActions('plots/jsi', [
      'calculate'
    ])
  }
}
</script>

<style lang="sass">
.jsi
  .switch
    padding: 20px 8px
</style>
