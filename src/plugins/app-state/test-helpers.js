/**
 * Extract query object from hash URL
 * @param {string} hash - Hash URL (e.g., '#/?cfg=...&panels=...' or '#/?s=...')
 * @returns {object} Query object (e.g., { cfg: '...', panels: '...' } or { s: '...' })
 */
export function extractQueryFromHash(hash) {
  const hashContent = hash.split('#/')[1]
  if (!hashContent) return {}
  return Object.fromEntries(new URLSearchParams(hashContent))
}
