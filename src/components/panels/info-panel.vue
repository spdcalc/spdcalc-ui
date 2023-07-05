<template lang="pug">
SPDPanel(
  title="Info"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  v-container
    v-card(outlined, color="navbar")
      v-card-title Poling Domains
      v-card-subtitle {{ polingDomainData.length }} domains
      v-card-text
        ParameterSelector.selector(
          v-model="panelSettings.polingDomainDisplay"
          , :items="['Fractional', 'Physical Length (µm)']"
          , label="Display as"
          , outlined
        )
        v-textarea.text(
          :value="polingDomains"
          , rows="2"
          , readonly
          , append-icon="mdi-content-copy"
          , @click:append="copyContent(polingDomains)"
        )
</template>

<script>
import panelMixin from '@/components/panel.mixin'
import { mapGetters } from 'vuex'
import { interruptDebounce } from '../../lib/batch-worker'
import ParameterSelector from '@/components/inputs/parameter-selector.vue'

const formatMicrons = new Intl.NumberFormat('en', {
  maximumFractionDigits: 4
  , minimumFractionDigits: 4
})

export default {
  name: 'info-panel'
  , mixins: [panelMixin]
  , data: () => ({
    panelSettings: {
      polingDomainDisplay: 'Fractional'
    }
    , polingDomainData: []
  })
  , components: {
    ParameterSelector
  }
  , computed: {
    polingDomains(){
      if (this.panelSettings.polingDomainDisplay === 'Fractional'){
        return this.polingDomainData.map(d => formatMicrons.format(d)).join(', ')
      } else {
        return this.polingDomainData.map(d => formatMicrons.format(d * this.polingPeriod)).join(', ')
      }
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'polingPeriod'
      , 'integrationConfig'
    ])
  }
  , created() {
    this.$on('parametersUpdated', () => this.redraw())
  }
  , methods: {
    redraw() {
      if (!this.panelSettings.autoUpdate) { return }
      this.calculate()
    }
    , calcDomains: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getPolingDomains'
        , this.spdConfig
      )
    })
    , async calculate() {
      this.loading = true

      try {
        const { result, duration } = await this.calcDomains()
        this.polingDomainData = result

        const totalTime = duration
        this.status = `done in ${totalTime.toFixed(2)}ms`
      } catch (error) {
        this.$store.dispatch('error', { error, context: 'while calculating info' })
      } finally {
        this.loading = false
      }
    }
    , copyContent(value) {
      try {
        navigator.clipboard.writeText(value)
        this.$store.dispatch('info', { message: 'Copied to clipboard', timeout: 2000 })
      } catch (err) {
        this.$store.dispatch('error', { error: err })
      }
    }
  }
}
</script>

<style lang="sass" scoped>
.selector
  margin-bottom: 0.25rem
.text ::v-deep(.v-input__slot)
  margin-bottom: 0
::v-deep(.v-text-field__details)
  display: none !important
</style>
