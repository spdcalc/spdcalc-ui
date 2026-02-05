<template lang="pug">
v-dialog(v-model="isOpen", width="600", persistent)
  SPDCard
    v-card-title.title Custom Crystal Editor
    v-card-subtitle (Custom crystals are <strong>unstable</strong> and currently enabled for evaluation)
    v-card-text
      v-select(
        v-model="selectedCrystalOption"
        :items="crystalSelectOptions"
        label="Crystal Preset"
        outlined
        @change="onCrystalSelection"
      )
      v-text-field(
        v-model="crystalValues.label"
        outlined
        label="Crystal Label"
        hint="Custom name for this crystal"
        :rules="[rules.required]"
        :error-messages="validationErrors.label"
      )
      .interp-uniaxial(v-if="selectedCrystalType === 'InterpolatedUniaxial'")
        v-textarea(
          v-model="crystalValues.wavelengths_nm_csv"
          outlined
          rows="1"
          label="Wavelengths (nm)"
          hint="Comma-separated list of wavelengths in nanometers (must be in ascending order)"
          :error-messages="validationErrors.wavelengths"
        )
        v-textarea(
          v-model="crystalValues.no_csv"
          outlined
          rows="1"
          label="Ordinary Indices (no)"
          hint="Comma-separated list of ordinary refractive indices"
          :error-messages="validationErrors.no"
        )
        v-textarea(
          v-model="crystalValues.ne_csv"
          outlined
          rows="1"
          label="Extraordinary Indices (ne)"
          hint="Comma-separated list of extraordinary refractive indices"
          :error-messages="validationErrors.ne"
        )
      v-alert(v-if="generalError", type="error", dense, text)
        | {{ generalError }}
    v-card-actions
      v-btn(
        v-if="editMode",
        dark,
        depressed,
        color="error",
        text,
        @click="showDeleteConfirmation = true"
      )
        | Delete
      v-spacer
      v-btn(
        dark,
        depressed,
        text,
        @click="cancel"
      )
        | Cancel
      v-btn(
        dark,
        depressed,
        color="primary",
        @click="save",
        :disabled="!canSave"
      )
        | {{ editMode ? 'Save' : 'Create' }}

  v-dialog(v-model="showDeleteConfirmation", max-width="400")
    SPDCard
      v-card-title
        | Confirm Deletion
      v-card-text
        | Are you sure you want to delete "{{ crystalValues.label }}"? This action cannot be undone.
      v-card-actions
        v-spacer
        v-btn(
          dark,
          depressed,
          text,
          @click="showDeleteConfirmation = false"
        )
          | Cancel
        v-btn(
          dark,
          depressed,
          color="error",
          @click="confirmDelete"
        )
          | Delete
</template>

<script>
import { mapGetters } from 'vuex'
import _uniqueId from 'lodash/uniqueId'
import SPDCard from '@/components/spd-card.vue'

export default {
  name: 'CrystalParametersDialog',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  components: {
    SPDCard
  },
  data: () => ({
    crystalValues: {
      id: null,
      label: '',
      wavelengths_nm_csv: '',
      no_csv: '',
      ne_csv: ''
    },
    editMode: false,
    selectedCrystalOption: null,
    selectedCrystalType: 'InterpolatedUniaxial',
    validationErrors: {
      label: [],
      wavelengths: [],
      no: [],
      ne: []
    },
    generalError: '',
    showDeleteConfirmation: false,
    rules: {
      required: v => !!v || 'Required field'
    }
  }),
  computed: {
    isOpen: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    ...mapGetters('parameters', {
      crystalCustomTypes: 'crystalCustomTypes',
      selectedCrystal: 'crystal'
    }),
    crystalSelectOptions() {
      const options = [
        { value: null, text: 'New Custom Crystal' }
      ]
      this.crystalCustomTypes.forEach(crystal => {
        options.push({ value: crystal.id, text: crystal.label })
      })
      return options
    },
    canSave() {
      return this.crystalValues.label &&
             this.crystalValues.wavelengths_nm_csv &&
             this.crystalValues.no_csv &&
             this.crystalValues.ne_csv
    }
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.initializeModal()
      }
    }
  },
  methods: {
    initializeModal() {
      // Check if a custom crystal is currently selected
      const currentCustomCrystal = this.crystalCustomTypes.find(
        c => c.id === this.selectedCrystal
      )

      if (currentCustomCrystal) {
        // Load the selected custom crystal for editing
        this.loadCrystalForEditing(currentCustomCrystal)
        this.selectedCrystalOption = currentCustomCrystal.id
      } else {
        // Start with a new crystal
        this.resetForm()
        this.selectedCrystalOption = null
      }
    },

    onCrystalSelection(selectedId) {
      if (selectedId === null) {
        // New crystal selected
        this.resetForm()
      } else {
        // Existing crystal selected
        const crystal = this.crystalCustomTypes.find(c => c.id === selectedId)
        if (crystal) {
          this.loadCrystalForEditing(crystal)
        }
      }
    },

    loadCrystalForEditing(crystal) {
      this.editMode = true
      this.crystalValues.id = crystal.id
      this.crystalValues.label = crystal.label

      // Convert arrays to CSV strings
      this.crystalValues.wavelengths_nm_csv = crystal.value.wavelengths_nm.join(', ')
      this.crystalValues.no_csv = crystal.value.no.join(', ')
      this.crystalValues.ne_csv = crystal.value.ne.join(', ')

      this.selectedCrystalType = crystal.value.name
      this.clearValidationErrors()
    },

    resetForm() {
      this.editMode = false
      this.crystalValues = {
        id: null,
        label: '',
        wavelengths_nm_csv: '',
        no_csv: '',
        ne_csv: ''
      }
      this.selectedCrystalType = 'InterpolatedUniaxial'
      this.clearValidationErrors()
    },

    clearValidationErrors() {
      this.validationErrors = {
        label: [],
        wavelengths: [],
        no: [],
        ne: []
      }
      this.generalError = ''
    },

    parseCSV(csvString) {
      return csvString
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '')
        .map(s => parseFloat(s))
    },

    validateData() {
      this.clearValidationErrors()
      let isValid = true

      // Validate label
      if (!this.crystalValues.label) {
        this.validationErrors.label.push('Crystal label is required')
        isValid = false
      }

      try {
        // Parse CSV fields
        const wavelengths = this.parseCSV(this.crystalValues.wavelengths_nm_csv)
        const no = this.parseCSV(this.crystalValues.no_csv)
        const ne = this.parseCSV(this.crystalValues.ne_csv)

        // Check for minimum data points
        if (wavelengths.length < 2) {
          this.validationErrors.wavelengths.push('At least 2 wavelength values required')
          isValid = false
        }

        // Check that all arrays have the same length
        if (wavelengths.length !== no.length || wavelengths.length !== ne.length) {
          this.generalError = `Array length mismatch: wavelengths (${wavelengths.length}), no (${no.length}), ne (${ne.length}). All arrays must have the same length.`
          isValid = false
        }

        // Validate wavelengths are positive and ascending
        for (let i = 0; i < wavelengths.length; i++) {
          if (isNaN(wavelengths[i]) || wavelengths[i] <= 0) {
            this.validationErrors.wavelengths.push('All wavelengths must be positive numbers')
            isValid = false
            break
          }
          if (i > 0 && wavelengths[i] <= wavelengths[i - 1]) {
            this.validationErrors.wavelengths.push('Wavelengths must be in ascending order')
            isValid = false
            break
          }
        }

        // Validate refractive indices are positive and greater or equal to 1
        for (let i = 0; i < no.length; i++) {
          if (isNaN(no[i]) || no[i] <= 1) {
            this.validationErrors.no.push('All ordinary indices must be greater than 1')
            isValid = false
            break
          }
        }

        for (let i = 0; i < ne.length; i++) {
          if (isNaN(ne[i]) || ne[i] <= 1) {
            this.validationErrors.ne.push('All extraordinary indices must be greater than 1')
            isValid = false
            break
          }
        }

      } catch (error) {
        this.generalError = `Parsing error: ${error.message}`
        isValid = false
      }

      return isValid
    },

    save() {
      // Validate input
      if (!this.validateData()) {
        return
      }

      // Parse CSV strings to arrays
      const wavelengths_nm = this.parseCSV(this.crystalValues.wavelengths_nm_csv)
      const no = this.parseCSV(this.crystalValues.no_csv)
      const ne = this.parseCSV(this.crystalValues.ne_csv)

      // Generate ID if creating new crystal
      const id = this.crystalValues.id || _uniqueId('custom-crystal-')

      // Create value object
      const value = {
        name: 'InterpolatedUniaxial',
        wavelengths_nm,
        no,
        ne
      }

      // Dispatch to store
      this.$store.commit('parameters/modifyCustomCrystal', {
        id,
        label: this.crystalValues.label,
        value
      })

      // Auto-select the crystal
      this.$store.commit('parameters/setCrystal', id)

      // Close modal and reset form
      this.isOpen = false
      this.resetForm()
    },

    confirmDelete() {
      if (this.crystalValues.id) {
        this.$store.commit('parameters/removeCustomCrystal', this.crystalValues.id)
        this.showDeleteConfirmation = false
        this.isOpen = false
        this.resetForm()
      }
    },

    cancel() {
      this.isOpen = false
      this.resetForm()
    }
  }
}
</script>

<style lang="sass">
.title
  margin-bottom: 1em
</style>
