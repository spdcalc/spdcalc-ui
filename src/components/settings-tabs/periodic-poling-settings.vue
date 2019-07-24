<template lang="pug">
v-container.properties(fluid, grid-list-lg, px-0, py-4)
  v-layout(align-start)
    v-flex(sm3)
      v-switch.pt-3(v-model="periodicPoling.enabled", label="Enable Periodic Poling")
    v-flex(v-if="periodicPoling.enabled", sm3)
      v-text-field(
        v-model="periodicPoling.period"
        , type="number"
        , label="Period"
        , suffix="um"
        , :readonly="periodicPoling.autoCalcPeriod"
        , :required="!periodicPoling.autoCalcPeriod"
        , :messages="periodicPoling.autoCalcPeriod ? '(auto calculating)' : ''"
      )
        template(v-slot:prepend)
          v-icon(
            @click="periodicPoling.autoCalcPeriod = !periodicPoling.autoCalcPeriod"
            , :color="periodicPoling.autoCalcPeriod ? 'blue' : ''"
          ) mdi-auto-fix
  v-layout(v-if="periodicPoling.enabled", align-start)
    v-flex(sm3)
      v-switch.pt-3(
        v-model="periodicPoling.apodizationEnabled"
        , label="Enable Apodization"
      )
    v-flex(sm3)
      v-text-field(
        v-model="periodicPoling.apodizationFWHM"
        , type="number"
        , label="Apodization FWHM"
        , suffix="um"
        , :disabled="!periodicPoling.apodizationEnabled"
        , :required="!periodicPoling.apodizationEnabled"
      )
    v-flex(sm3)
      v-text-field(
        v-model="periodicPoling.apodizationFWHM"
        , type="number"
        , label="Apodization Steps"
        , :disabled="!periodicPoling.apodizationEnabled"
        , :required="!periodicPoling.apodizationEnabled"
      )
</template>

<script>
// import { mapGetters } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input'

export default {
  name: 'PeriodicPolingSettings'
  , props: {
  }
  , data: () => ({
    periodicPoling: {
      enabled: false
      , autoCalcPeriod: false
    }
  })
  , components: {
    ParameterInput
  }
  , computed: {
  }
  , methods: {
  }
}
</script>
