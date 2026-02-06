// App state schema versioning and migrations
// Each migration function receives { version, data } and returns { version, data }
// Migrations are applied recursively, with each calling previous migrations as needed

const migrateV0 = ({ version, data }) => {
  if (version !== 0) {
    // Not v0, pass through
    return { version, data }
  }

  const { cfg, panels } = data

  // Migrate v0 structure to current structure
  return {
    version: 1,
    data: {
      parameters: cfg,
      panels: panels,
    }
  }
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
export function parseAppState({ version, data }) {
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
 * @returns {object} Versioned app state object { version, data }
 */
export function createAppState(data) {
  return {
    version: CURRENT_VERSION,
    data,
  }
}
