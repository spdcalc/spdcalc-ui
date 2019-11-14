<template lang="pug">
SPDPanel(
  title="Joint Spectral Intensity"
  , @refresh="redraw"
  , @remove="$emit('remove')"
  , :loading="isLoading"
)
  SPDHistogram(
    :chart-data="data"
    , :axes="axes"
    , :log-scale="enableLogScale"
    , x-title="Signal wavelength (nm)"
    , y-title="Idler wavelength (nm)"
  )
    template(#chart-bar)
      v-spacer
      IconButton(icon="mdi-math-log", @click="enableLogScale = !enableLogScale", tooltip="toggle log scale", :color="enableLogScale ? 'yellow' : ''")
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import SPDHistogram from '@/components/plots/spd-histogram'
import SPDPanel from '@/components/spd-panel'
import IconButton from '@/components/icon-button'

export default {
  name: 'jsa'
  , data: () => ({
    enableLogScale: false
  })
  , components: {
    SPDHistogram
    , SPDPanel
    , IconButton
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

<style lang="sass" scoped>
.jsi
  .switch
    padding: 0px 8px
    align-items: center
    >>> .v-input__slot
      margin-bottom: 0
    >>> .v-messages
      display: none
  >>> .v-toolbar__content .v-btn.v-btn--icon
    height: 40px
    width: 40px
</style>
