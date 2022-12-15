<template lang="pug">
.filter-settings
  v-sheet.pt-2.px-2(tile, color="grey darken-3")
    v-container(fluid, grid-list-lg, px-0, py-0)
      v-layout(align-start)
        v-flex(sm3)
          v-select(:items="['Gaussian', 'Square']", label="Signal Filter")
        v-flex(sm3)
          v-text-field(type="number", label="Center Wavelength", suffix="nm")
        v-flex(sm3)
          v-text-field(type="number", label="Bandwidth", suffix="nm")
        v-flex(sm3)
  v-sheet.pt-2.px-2(tile, color="brown darken-3")
    v-container(fluid, grid-list-lg, px-0, py-0)
      v-layout(align-start)
        v-flex(sm3)
          v-select(:items="['Gaussian', 'Square']", label="Idler Filter")
        v-flex(sm3)
          v-text-field(type="number", label="Center Wavelength", suffix="nm")
        v-flex(sm3)
          v-text-field(type="number", label="Bandwidth", suffix="nm")
        v-flex(sm3)
</template>

<script>
// import { mapGetters } from 'vuex'
import ParameterInput from '@/components/inputs/parameter-input.vue'

export default {
  name: 'FilterSettings'
  , props: {
  }
  , data: () => ({
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
