<template lang="pug">
v-dialog(v-model="isOpen", width="500")
  v-card
    v-card-title
      span Edit Crystal Parameters
    v-card-text
      //- TODO: Crystal selector for existing custom crystals
      //- TODO: Add ability to create new custom crystal types
      v-row(v-if="selectedCrystal?.value?.name === 'Interpolated Uniaxial'")
        v-col(xs12)
          v-textarea(v-model="crystalValues.wavelengths_ms_csv", outlined, rows="1", label="Wavelengths (nm)", hint="Comma-separated list of wavelengths in nanometers", persistent-hint)
          v-textarea(v-model="crystalValues.no_csv", outlined, rows="1", label="Ordinary Indices (no)", hint="Comma-separated list of ordinary refractive indices", persistent-hint)
          v-textarea(v-model="crystalValues.ne_csv", outlined, rows="1", label="Extraordinary Indices (ne)", hint="Comma-separated list of extraordinary refractive indices", persistent-hint)
    v-card-actions
      v-spacer
      v-btn(color="secondary", text, @click="isOpen = false")
        span Cancel
      v-btn(color="primary", text, @click="dismiss")
        span Import
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'CrystalParametersDialog'
  , props: {
    value: {
      type: Boolean
      , default: false
    }
  }
  , data: () => ({
    crystalValues: {},
    selectedCrystal: {},

    crystalTypes: [
      {
        label: 'Interpolated Uniaxial',
        allowedParams: ['wavelengths_ms', 'no', 'ne']
      },
      // add more custom types when implemented in the future
    ]
  })
  , components: {
  }
  , computed: {
    isOpen: {
      get() {
        return this.value
      }
      , set(val) {
        // this.$dispatch('parameters/removeCustomCrystal', label)
        // this.$dispatch('parameters/modifyCustomCrystal', { label, value })
        this.$emit('input', val)
      }
    }
  }
  , methods: {
    async dismiss() {
      // todo
      this.$emit('input', false)
    },
    ...mapGetters('parameters', {
      'crystalCustomTypes': 'crystalCustomTypes',
    })
  }
}
</script>

<style lang="sass">
</style>
