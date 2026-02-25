import InterpolatedUniaxial from './interpolated-uniaxial.vue'

// Component registry
export const crystalTypeComponents = {
  'InterpolatedUniaxial': InterpolatedUniaxial
}

// Get component by type name
export const getCrystalTypeComponent = (typeName) =>
  crystalTypeComponents[typeName] || crystalTypeComponents['InterpolatedUniaxial']

// Get default values for a crystal type (in store format)
export const getDefaultValues = (typeName) => {
  const component = getCrystalTypeComponent(typeName)
  return component.props.initialValue.default()
}

// Get available types (for future selector)
export const getAvailableTypes = () =>
  Object.values(crystalTypeComponents).map(comp => ({
    value: comp.crystalType.name,
    text: comp.crystalType.label
  }))
