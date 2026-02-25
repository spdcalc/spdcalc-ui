<template lang="pug">
div
  v-layout(align-start, wrap)
    v-flex(xs10)
      v-textarea(
        v-model="spectral_csv"
        outlined
        rows="1"
        :label="spectralLabel"
        :hint="spectralHint"
        :error-messages="validationErrors.spectral"
        :rules="[rules.required]"
      )
    v-flex(xs2)
      v-select(
        v-model="spectralUnit"
        outlined
        :items="spectralUnitOptions"
      )
  v-textarea(
    v-model="no_csv"
    outlined
    rows="1"
    label="Ordinary Indices (no)"
    hint="Comma-separated list of ordinary refractive indices"
    :error-messages="validationErrors.no"
    :rules="[rules.required]"
  )
  v-textarea(
    v-model="ne_csv"
    outlined
    rows="1"
    label="Extraordinary Indices (ne)"
    hint="Comma-separated list of extraordinary refractive indices"
    :error-messages="validationErrors.ne"
    :rules="[rules.required]"
  )
  v-alert(v-if="generalError", type="error", dense, text)
    | {{ generalError }}
</template>

<script>
const parseCSV = (csvString) =>
  csvString
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => parseFloat(s))

const arrayToCSV = (arr) => arr.join(', ')

export default {
  name: 'InterpolatedUniaxialEditor',

  // Metadata for registry
  crystalType: {
    name: 'InterpolatedUniaxial',
    label: 'Interpolated Uniaxial Crystal'
  },

  props: {
    initialValue: {
      type: Object,
      default: () => ({
        name: 'InterpolatedUniaxial',
        wavelengths_nm: [],
        no: [],
        ne: []
      })
    }
  },

  data: () => ({
    // Form state (CSV strings)
    spectral_csv: '',
    spectralUnit: 'nm',
    spectralUnitOptions: [
      { value: 'nm', text: 'nm' },
      { value: 'THz', text: 'THz' }
    ],
    no_csv: '',
    ne_csv: '',
    // Validation state
    validationErrors: {
      spectral: [],
      no: [],
      ne: []
    },
    generalError: '',
    rules: {
      required: v => !!v || 'Required field'
    }
  }),

  computed: {
    spectralLabel() {
      return this.spectralUnit === 'nm' ? 'Wavelengths (nm)' : 'Frequencies (THz)'
    },
    spectralHint() {
      return 'Comma-separated list in ascending order'
    }
  },

  watch: {
    // Optional: emit validation state for reactive button disabling
    spectral_csv() { this.emitValidityChanged() },
    no_csv() { this.emitValidityChanged() },
    ne_csv() { this.emitValidityChanged() }
  },

  mounted() {
    // Load initial values (one-time conversion)
    if (this.initialValue) {
      // Determine which spectral unit to use based on what's in initialValue
      if (this.initialValue.frequencies_thz && this.initialValue.frequencies_thz.length > 0) {
        this.spectralUnit = 'THz'
        this.spectral_csv = arrayToCSV(this.initialValue.frequencies_thz)
      } else {
        this.spectralUnit = 'nm'
        this.spectral_csv = arrayToCSV(this.initialValue.wavelengths_nm || [])
      }
      this.no_csv = arrayToCSV(this.initialValue.no || [])
      this.ne_csv = arrayToCSV(this.initialValue.ne || [])
    }
  },

  methods: {
    // Public API: Validate and return boolean
    validate() {
      this.validationErrors = { spectral: [], no: [], ne: [] }
      this.generalError = ''
      let isValid = true

      const spectralValues = parseCSV(this.spectral_csv)
      const no = parseCSV(this.no_csv)
      const ne = parseCSV(this.ne_csv)

      // Field-level validation (required) handled by :rules
      // Overall validation checks:

      // Minimum length
      if (spectralValues.length < 2) {
        this.validationErrors.spectral.push('At least 2 values required')
        isValid = false
      }
      if (no.length < 2) {
        this.validationErrors.no.push('At least 2 values required')
        isValid = false
      }
      if (ne.length < 2) {
        this.validationErrors.ne.push('At least 2 values required')
        isValid = false
      }

      // Array length matching
      if (spectralValues.length !== no.length || spectralValues.length !== ne.length) {
        this.generalError = 'All arrays must have the same length'
        isValid = false
      }

      // Spectral ordering validation (always ascending for both nm and THz)
      const isAscending = spectralValues.every((val, idx, arr) =>
        idx === 0 || val > arr[idx - 1]
      )
      if (!isAscending && spectralValues.length >= 2) {
        this.validationErrors.spectral.push('Must be in strictly ascending order')
        isValid = false
      }

      // Spectral values must be positive
      if (spectralValues.some(val => val <= 0)) {
        this.validationErrors.spectral.push('All values must be positive')
        isValid = false
      }

      // Refractive indices >= 1
      if (no.some(val => val < 1)) {
        this.validationErrors.no.push('All indices must be greater than or equal to 1')
        isValid = false
      }
      if (ne.some(val => val < 1)) {
        this.validationErrors.ne.push('All indices must be greater than or equal to 1')
        isValid = false
      }

      // Check for NaN
      if (spectralValues.some(isNaN) && this.spectral_csv.trim() !== '') {
        this.validationErrors.spectral.push('All values must be valid numbers')
        isValid = false
      }
      if (no.some(isNaN) && this.no_csv.trim() !== '') {
        this.validationErrors.no.push('All values must be valid numbers')
        isValid = false
      }
      if (ne.some(isNaN) && this.ne_csv.trim() !== '') {
        this.validationErrors.ne.push('All values must be valid numbers')
        isValid = false
      }

      return isValid
    },

    // Public API: Get validated data in store format
    getData() {
      if (!this.validate()) {
        return null
      }

      const data = {
        name: 'InterpolatedUniaxial',
        no: parseCSV(this.no_csv),
        ne: parseCSV(this.ne_csv)
      }

      // Add either wavelengths_nm or frequencies_thz depending on selected unit
      if (this.spectralUnit === 'nm') {
        data.wavelengths_nm = parseCSV(this.spectral_csv)
      } else {
        data.frequencies_thz = parseCSV(this.spectral_csv)
      }

      return data
    },

    // Optional: Emit validity for reactive button state
    emitValidityChanged() {
      // Don't show errors while typing, just track validity
      const hasRequiredFields = this.spectral_csv && this.no_csv && this.ne_csv
      this.$emit('validation-changed', { isValid: hasRequiredFields })
    }
  }
}
</script>

<style scoped lang="sass">
.gap-2
  gap: 8px
</style>
