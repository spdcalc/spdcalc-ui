// App state schema versioning and migrations
// Each migration function receives { version, data } and returns { version, data }
// Migrations are applied recursively, with each calling previous migrations as needed

// v0 → v1: Identity migration (current unversioned format)
// This is the base case for unversioned URLs
const migrateV0 = (appState) => {
  // v0 is the base case - just return data as-is with version marker
  return { version: 0, data: appState.data }
}

// v1 → current: Currently identical to v0
// Future migrations will be added here following this pattern:
// const migrateV1 = (appState) => {
//   // First apply previous migration if needed
//   const migrated = appState.version < 1 ? migrateV0(appState) : appState
//
//   // Then apply v1 → v2 changes
//   return {
//     version: 1,
//     data: {
//       ...migrated.data,
//       // Add new fields, rename fields, etc.
//     }
//   }
// }

// Export current version for validation
export const CURRENT_VERSION = 1

// Export the latest migration as the main entry point
// For v1, this is just migrateV0 since we're establishing the baseline
export const applyMigrations = migrateV0

// Export individual migrations for testing
export const migrations = {
  migrateV0,
}

/**
 * Parse raw app state object from URL hash
 * Handles version detection and applies migrations
 *
 * @param {object} rawData - Raw parsed JSON from URL hash
 * @returns {object} Migrated app state with structure { version, data }
 */
export function parseAppState(rawData) {
  let version, data

  // Detect version from URL data
  if (rawData && typeof rawData === 'object' && 'v' in rawData) {
    // Versioned format: { v: 1, d: {...} }
    version = rawData.v
    data = rawData.d
  } else {
    // Unversioned (v0) - current format before migration system
    version = 0
    data = rawData
  }

  // Apply migrations (recursive chain brings to latest version)
  // Pass full appState object so migrations know where to start
  const migrated = applyMigrations({ version, data })

  // Return migrated state
  return migrated  // { version: CURRENT_VERSION, data: {...} }
}

/**
 * Create app state object ready for encoding to URL hash
 * Wraps data with current version
 *
 * @param {object} data - App state data to encode
 * @returns {object} Versioned app state object { v: version, d: data }
 */
export function createAppState(data) {
  return {
    v: CURRENT_VERSION,
    d: data
  }
}
