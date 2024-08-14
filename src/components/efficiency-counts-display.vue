<template lang="pug">
.efficiency-counts-display
  v-container(fluid, grid-list-sm)
    v-layout(wrap)
      v-row
        v-flex(xs4, offset-xs2)
          ParameterInput(
            label="ηs"
            , tooltip="signal efficiency"
            , display-only
            , :value="value.signal"
            , :warningMsg="value.signal >= 1 ? efficiencyWarning : undefined"
            , :sigfigs="4"
          )
        v-flex(xs4)
          ParameterInput(
            label="ηi"
            , tooltip="idler efficiency"
            , display-only
            , :value="value.idler"
            , :warningMsg="value.idler >= 1 ? efficiencyWarning : undefined"
            , :sigfigs="4"
          )
      v-row
        v-flex(xs4)
          ParameterInput(
            label="Rc"
            , tooltip="coincidence count rate"
            , display-only
            , :value="value.coincidences"
            , :sigfigs="4"
          )
        v-flex(xs4)
          ParameterInput(
            label="Rss"
            , tooltip="signal singles count rate"
            , display-only
            , :value="value.signal_singles"
            , :sigfigs="4"
          )
        v-flex(xs4)
          ParameterInput(
            label="Rsi"
            , tooltip="idler singles count rate"
            , display-only
            , :value="value.idler_singles"
            , :sigfigs="4"
          )
</template>

<script>
import ParameterInput from '@/components/inputs/parameter-input.vue'
import { efficiencyWarning } from '@/text'

export default {
  name: 'EfficiencyCountsDisplay',
  components: {
    ParameterInput,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      efficiencyWarning,
    }
  },
}
</script>

<style scoped lang="sass">
.efficiency-counts-display
  margin: 1em 0
  margin-top: 0em
  padding: 0em 1.5em
  :v-deep(.row + .row)
    margin-top: 10px
</style>
