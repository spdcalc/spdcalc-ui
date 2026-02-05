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
        v-model="crystalLabel"
        outlined
        label="Crystal Label"
        hint="Custom name for this crystal"
        :rules="[rules.required]"
      )
      component(
        ref="crystalTypeEditor"
        :is="currentCrystalTypeComponent"
        :key="componentKey"
        :initial-value="crystalTypeData"
        @validation-changed="handleValidationChanged"
      )
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
        | Are you sure you want to delete "{{ crystalLabel }}"? This action cannot be undone.
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
import { getCrystalTypeComponent, getDefaultValues } from './crystal-types'

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
    crystalId: null,
    crystalLabel: '',
    crystalTypeData: getDefaultValues('InterpolatedUniaxial'),
    editMode: false,
    selectedCrystalOption: null,
    selectedCrystalType: 'InterpolatedUniaxial',
    childIsValid: false,  // Tracks child validity for button state
    componentKey: 0,  // Increment to force child component re-mount
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
    currentCrystalTypeComponent() {
      return getCrystalTypeComponent(this.selectedCrystalType)
    },
    canSave() {
      return this.crystalLabel && this.childIsValid
    }
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.initializeModal()
      }
    },
    selectedCrystalType(newType) {
      // Reset data when type changes (future-proofing)
      this.crystalTypeData = getDefaultValues(newType)
      this.componentKey++  // Force child component to re-mount with new type
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
      this.crystalId = crystal.id
      this.crystalLabel = crystal.label
      this.selectedCrystalType = crystal.value.name
      this.crystalTypeData = crystal.value  // Store format
      this.componentKey++  // Force child component to re-mount with new data
    },

    resetForm() {
      this.editMode = false
      this.crystalId = null
      this.crystalLabel = ''
      this.selectedCrystalType = 'InterpolatedUniaxial'
      this.crystalTypeData = getDefaultValues(this.selectedCrystalType)
      this.childIsValid = false
      this.componentKey++  // Force child component to re-mount with fresh data
    },

    handleValidationChanged({ isValid }) {
      this.childIsValid = isValid
    },

    save() {
      // Call child method to get validated data
      const data = this.$refs.crystalTypeEditor.getData()
      if (!data) {
        // Validation failed, errors shown in component
        return
      }

      const id = this.crystalId || _uniqueId('custom-crystal-')

      this.$store.commit('parameters/modifyCustomCrystal', {
        id,
        label: this.crystalLabel,
        value: data  // Already in store format
      })

      // Auto-select the crystal
      this.$store.commit('parameters/setCrystal', id)

      // Close modal and reset form
      this.isOpen = false
      this.resetForm()
    },

    confirmDelete() {
      if (this.crystalId) {
        this.$store.commit('parameters/removeCustomCrystal', this.crystalId)
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
