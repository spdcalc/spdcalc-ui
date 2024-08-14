<template lang="pug">
SPDPanel(
  title="Heralding Calculator"
  , @refresh="calculate"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="1"
)
  template(#secondary-toolbar)
    .props-toolbar
      ParameterInput(
        label="Signal Waist"
        , v-model="params.signal_waist"
        , :sigfigs="2"
        , units="µm"
        , lazy
      )
      ParameterInput(
        label="Idler Waist"
        , v-model="params.idler_waist"
        , :sigfigs="2"
        , units="µm"
        , lazy
      )
      ParameterInput(
        label="Pump Waist"
        , v-model="params.pump_waist"
        , :sigfigs="2"
        , units="µm"
        , lazy
      )
    .props-toolbar.center
      v-btn.calc(small, color="primary", @click="calculate", :loading="loading") Calculate
  v-container
    .display
      EfficiencyCountsDisplay(:value="results")

</template>

<script>
import { mapGetters } from 'vuex'
import panelMixin from '@/components/panel.mixin'
import SPDPanel from '@/components/spd-panel.vue'
import ParameterInput from '@/components/inputs/parameter-input.vue'
import EfficiencyCountsDisplay from '@/components/efficiency-counts-display.vue'
import { interruptDebounce } from '../../lib/batch-worker'
// new thread

export default {
  name: 'heralding-calculator',
  props: {},
  mixins: [panelMixin],
  data: () => ({
    loading: false,
    params: {
      signal_waist: 100,
      idler_waist: 100,
      pump_waist: 100,
    },
    results: {},
  }),
  components: {
    SPDPanel,
    ParameterInput,
    EfficiencyCountsDisplay,
  },
  computed: {
    ...mapGetters('parameters', ['spdConfig', 'integrationConfig']),
    ...mapGetters('plots/jsi', ['data']),
  },
  created() {
    const unwatch = this.$store.watch(
      (state, getters) =>
        getters['parameters/isReady'] &&
        !getters['parameters/isEditing'] && {
          ...getters['parameters/spdConfig'],
          ...getters['parameters/integrationConfig'],
        },
      (refresh) => refresh && this.calculate(),
      { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
    })
  },
  mounted() {
    this.calculate()
  },
  methods: {
    clear() {
      this.results = {}
    },
    calculate() {
      this.results = {}
      return this.getResults()
        .then(({ result, duration }) => {
          this.results = result
        })
        .catch((error) => {
          this.$store.dispatch('error', {
            error,
            context: 'while calculating heralding results',
          })
        })
    },
    getResults: interruptDebounce(function () {
      return this.spdWorkers.execSingle(
        'getHeraldingResults',
        this.spdConfig,
        { ...this.integrationConfig, size: 20 },
        this.params.signal_waist,
        this.params.idler_waist,
        this.params.pump_waist
      )
    }, 300),
  },
}
</script>

<style lang="sass" scoped>
.props-toolbar.center
  display: flex
  justify-content: center
.props-toolbar.right
  display: flex
  justify-content: flex-end
.props-toolbar .calc
  flex: none
.display
  margin-top: 2em
</style>
