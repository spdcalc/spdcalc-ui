# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SPDCalc UI is a scientific web application for calculating optical properties of spontaneous parametric down-conversion (SPDC) crystals. It's a Vue 2 SPA with a Rust/WebAssembly computation backend that performs quantum optics simulations in the browser using multi-threaded Web Workers.

**Tech Stack**: Vue 2.6 + Vuex + Vuetify + Rust/WASM + Vite

## Development Commands

### Setup
```bash
cargo install rsw
bun install
```

### Development
```bash
bun run dev           # Runs rsw watch + vite dev server
```
This starts two processes concurrently:
- `rsw watch` - Watches Rust WASM code and rebuilds on changes
- `vite --host` - Dev server with HMR

### Building
```bash
bun run build         # rsw build && vite build
bun run serve         # Build and preview production build
```

### Code Quality
```bash
bun run lint          # ESLint with auto-fix
```

### Deployment
```bash
bun run deploy        # Runs deploy.sh (GitHub Pages)
```

## Architecture

### Vuex State Management

Five core modules in [src/store/](src/store/):

- **parameters** - SPD configuration parameters with auto-calculation logic
- **panels** - Dynamic panel loading/unloading state
- **presets** - Saved user configurations (persisted to localStorage via vuex-persist)
- **jobs** - Job queue tracking for async computations
- **alerts** - UI notification messages

**Key Plugins**:
- `autocalc.plugin.js` - Watches parameter changes and auto-calculates derived values (crystal theta angle, periodic poling period, integration limits, waist positions). Uses `mutatingCallback` guard to prevent recursive mutations.
- `preset-loader.plugin.js` - Handles loading presets from localStorage and URL hash
- `parameter-hash-storage.js` - Persists full application state to URL hash for shareable links

### Dynamic Panel System

Panels are the core UI concept - each displays different SPDC calculations (Joint Spectrum, Phasematching Curves, Hong-Ou-Mandel Dip, etc.).

**How it works**:
1. Panel registry in [src/components/panels/index.js](src/components/panels/index.js) defines 13+ panel types
2. Vuex `panels` module tracks which panels are active
3. [src/views/Main.vue](src/views/Main.vue) dynamically renders panels using `<v-component :is="panel.component">`
4. All calculation panels use [src/components/panel.mixin.js](src/components/panel.mixin.js)

### Panel Mixin Pattern

[src/components/panel.mixin.js](src/components/panel.mixin.js) provides shared logic for all calculation panels:
- BatchWorker initialization for multi-threaded computations
- Auto-update watchers that trigger recalculation on parameter changes
- Settings persistence (deep watch on `panelSettings`)
- Debounced `calculate()` method (100ms)
- Status/loading state management
- Cleanup on destroy

Each panel component:
1. Includes the mixin
2. Defines `panelSettings` with panel-specific configuration
3. Implements a `calculate()` method that uses `this.spdWorkers`
4. Listens to `parametersUpdated` event to trigger recalculation

### Web Worker + WASM Architecture

**Four-layer architecture**:

1. **Rust WASM** - [@rsw/spdcalcwasm/](file:///@rsw/spdcalcwasm/)
   - Core computation engine (wraps `spdcalc` crate v2.0)
   - Built with `rsw` (configured in [rsw.toml](rsw.toml))
   - Uses `wasm-bindgen` for JS interop
   - Profile: Always builds in `release` mode during watch

2. **WASM Wrapper** - [src/workers/spdcalc.wasm.js](src/workers/spdcalc.wasm.js)
   - async methods wrapping Rust functions
   - Converts JS objects → Rust structs (IntegrationConfig, WaistRanges, Grid2D)
   - Uses Comlink's `transfer()` for zero-copy TypedArray transfers

3. **Worker Factory** - [src/workers/make-worker.js](src/workers/make-worker.js)
   - Uses Comlink to expose WASM methods via RPC
   - Vite plugin `vite-plugin-comlink` handles worker bundling

4. **Batch Worker** - [src/lib/batch-worker.js](src/lib/batch-worker.js)
   - **CPU-aware**: Detects cores via `navigator.hardwareConcurrency`
   - **Partitions work**: `partitionSteps()` splits calculations across workers
   - **Cancellable**: Returns receipts with `cancel()` method
   - **Queue-based**: Uses [src/lib/worker-queue.js](src/lib/worker-queue.js) for concurrency management
   - **Interruptible**: `interruptDebounce()` allows cancelling in-flight calculations

**Usage in panels**:
```javascript
// In panel component
this.spdWorkers = BatchWorker(createWorker) // Creates worker pool

// Partition work across cores
const partitions = this.spdWorkers.partitionSteps([min, max], steps)
const argList = partitions.map(p => [...args, p.range, p.count])

// Execute in parallel
const receipt = this.spdWorkers.execAndConcat('methodName', argList)
receipt.promise.then(({ result, duration }) => {
  // result is concatenated TypedArray from all workers
})

// Cancel if needed
this.cancel() // Destroys workers and recreates pool
```

### Vite Configuration

[vite.config.js](vite.config.js) key points:
- `ViteRsw()` plugin enables WASM in both main thread and workers
- `unplugin-vue-components` auto-imports Vuetify components
- CORS headers required for SharedArrayBuffer/WASM threads:
  - `Cross-Origin-Embedder-Policy: credentialless`
  - `Cross-Origin-Opener-Policy: same-origin`
- Alias: `@/` → `src/`, `~/` → `node_modules/`
- SASS variables auto-imported: `@/variables.scss`

### URL State Persistence & Versioning

The application implements a sophisticated URL-based state persistence system with versioning support for backward compatibility.

**Architecture** (clean separation of concerns):

1. **String Encoding/Decoding** - [src/lib/url-hash-utils.js](src/lib/url-hash-utils.js)
   - `toHashableString(data)` - JSON.stringify → LZUTF8 compression → Base64
   - `fromHashString(hash)` - Base64 → LZUTF8 decompression → JSON.parse
   - Size monitoring: warns when approaching Firefox 65KB limit (60KB threshold)
   - Development logging: compression ratios and sizes

2. **Schema Versioning & Migrations** - [src/store/app-state/migrations.js](src/store/app-state/migrations.js)
   - `createAppState(data)` - Wraps data with current version: `{ v: 1, d: {...} }`
   - `parseAppState(rawData)` - Detects version and applies migrations
   - `applyMigrations(appState)` - Recursive migration chain
   - Treats unversioned URLs as v0 for backward compatibility

3. **Store Integration** - [src/store/parameters.js](src/store/parameters.js) & [src/store/panels/index.js](src/store/panels/index.js)
   - Encoding: `createAppState(data) → toHashableString() → URL`
   - Decoding: `fromHashString() → parseAppState() → merge into state`
   - Version validation logs in development mode

**URL Format**:
```
?cfg=[BASE64_COMPRESSED_CONFIG]&panels=[BASE64_COMPRESSED_PANELS]
```

**Versioned Data Structure**:
```javascript
{
  v: 1,        // Schema version
  d: {         // Data payload
    autoCalcTheta: true,
    spdConfig: {...},
    integrationConfig: {...}
  }
}
```

**Key Features**:
- **100% Backward Compatible**: Unversioned URLs (v0) continue to work
- **Migration Support**: Safe schema evolution without breaking existing shared links
- **Size Monitoring**: Warns when URLs approach browser limits
- **Compression**: LZUTF8 typically achieves 60-80% size reduction
- **Auto-Sync**: URL updates automatically as state changes (no page refresh needed)

**Adding Migrations**:

When schema changes are needed (e.g., renaming fields, adding required data):

```javascript
// In src/store/app-state/migrations.js

// Add new migration function
const migrateV2 = (appState) => {
  // Apply previous migrations if needed
  const migrated = appState.version < 2 ? migrateV1(appState) : appState

  // Apply v2 specific changes
  return {
    version: 2,
    data: {
      ...migrated.data,
      newFieldName: migrated.data.oldFieldName,  // Rename field
      // Keep old field for backward compat
    }
  }
}

// Update exports
export const applyMigrations = migrateV2
export const CURRENT_VERSION = 2

// Add to migrations object for testing
export const migrations = {
  migrateV0,
  migrateV1,
  migrateV2,
}
```

**Testing Migrations**:
```bash
bun test src/store/app-state/migrations.test.js
```

## Important Patterns

### Adding a New Panel

1. Create component in [src/components/panels/](src/components/panels/)
2. Include `panel.mixin.js`
3. Implement `calculate()` method using `this.spdWorkers`
4. Register in [src/components/panels/index.js](src/components/panels/index.js)
5. Panel will automatically appear in UI panel selector

### Adding a WASM Method

1. Add Rust function to [@rsw/spdcalcwasm/src/lib.rs](file:///@rsw/spdcalcwasm/src/lib.rs)
2. Wrap in [src/workers/spdcalc.wasm.js](src/workers/spdcalc.wasm.js) with proper type conversions
3. Use `transfer()` from Comlink for TypedArray returns (zero-copy)
4. Call via `this.spdWorkers` in panel components

### Auto-Calculation

[src/store/autocalc.plugin.js](src/store/autocalc.plugin.js) watches specific parameters and auto-calculates derived values:
- Crystal theta angle from phi/wavelengths
- Periodic poling period from wavelengths/type
- Integration limits from wavelength ranges
- Signal/idler waist positions from pump waist

To add new auto-calculations, add watchers in this plugin using the `mutatingCallback` pattern to avoid infinite loops.

## File Structure Notes

- **No tests configured** - No testing framework present
- **Pug templates** - Many components use Pug instead of HTML
- **Service Worker** - PWA support via `register-service-worker`
- **CI/CD** - [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and deploys to GitHub Pages on push to `master`

## Development Notes

- Rust WASM always builds in `release` mode (see [rsw.toml](rsw.toml):40) - no dev mode for WASM
- Worker pool size defaults to `navigator.hardwareConcurrency` (typically 2-16 cores)
- All panels auto-update when parameters change (unless `autoUpdate: false` in panel settings)
- Debouncing is critical - all `calculate()` methods are debounced 100ms
- Use `this.cancel()` in panels to interrupt running calculations when parameters change