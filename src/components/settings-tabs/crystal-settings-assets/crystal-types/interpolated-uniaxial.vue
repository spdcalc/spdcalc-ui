<template lang="pug">
div
  v-textarea(
    v-model="wavelengths_nm_csv"
    outlined
    rows="1"
    label="Wavelengths (nm)"
    hint="Comma-separated list in ascending order"
    :error-messages="validationErrors.wavelengths"
    :rules="[rules.required]"
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
    wavelengths_nm_csv: '',
    no_csv: '',
    ne_csv: '',
    // Validation state
    validationErrors: {
      wavelengths: [],
      no: [],
      ne: []
    },
    generalError: '',
    rules: {
      required: v => !!v || 'Required field'
    }
  }),

  watch: {
    // Optional: emit validation state for reactive button disabling
    wavelengths_nm_csv() { this.emitValidityChanged() },
    no_csv() { this.emitValidityChanged() },
    ne_csv() { this.emitValidityChanged() }
  },

  mounted() {
    // Load initial values (one-time conversion)
    if (this.initialValue) {
      this.wavelengths_nm_csv = arrayToCSV(this.initialValue.wavelengths_nm || [])
      this.no_csv = arrayToCSV(this.initialValue.no || [])
      this.ne_csv = arrayToCSV(this.initialValue.ne || [])
    }
  },

  methods: {
    // Public API: Validate and return boolean
    validate() {
      this.validationErrors = { wavelengths: [], no: [], ne: [] }
      this.generalError = ''
      let isValid = true

      const wavelengths = parseCSV(this.wavelengths_nm_csv)
      const no = parseCSV(this.no_csv)
      const ne = parseCSV(this.ne_csv)

      // Field-level validation (required) handled by :rules
      // Overall validation checks:

      // Minimum length
      if (wavelengths.length < 2) {
        this.validationErrors.wavelengths.push('At least 2 values required')
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
      if (wavelengths.length !== no.length || wavelengths.length !== ne.length) {
        this.generalError = 'All arrays must have the same length'
        isValid = false
      }

      // Wavelengths ascending
      const isAscending = wavelengths.every((val, idx, arr) =>
        idx === 0 || val > arr[idx - 1]
      )
      if (!isAscending && wavelengths.length >= 2) {
        this.validationErrors.wavelengths.push('Must be in strictly ascending order')
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
      if (wavelengths.some(isNaN) && this.wavelengths_nm_csv.trim() !== '') {
        this.validationErrors.wavelengths.push('All values must be valid numbers')
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

      return {
        name: 'InterpolatedUniaxial',
        wavelengths_nm: parseCSV(this.wavelengths_nm_csv),
        no: parseCSV(this.no_csv),
        ne: parseCSV(this.ne_csv)
      }
    },

    // Optional: Emit validity for reactive button state
    emitValidityChanged() {
      // Don't show errors while typing, just track validity
      const hasRequiredFields = this.wavelengths_nm_csv && this.no_csv && this.ne_csv
      this.$emit('validation-changed', { isValid: hasRequiredFields })
    }
  }
}
</script>
