import LZUTF8 from 'lzutf8'
import Promise from 'bluebird'
// "ByteArray" (default), "Buffer", "StorageBinaryString" or "Base64"
const HASH_ENCODING = 'Base64'

// adapter....
export const decompressLZUTF8 = (input, options) => new Promise((resolve, reject) => {
  // come on people... write your apis to conform to established standards
  LZUTF8.decompressAsync(input, options, (result, error) => {
    if ( error ){
      return reject(error)
    }

    resolve(result)
  })
})

export function fromHashString( hash ){
  return decompressLZUTF8(hash, { inputEncoding: HASH_ENCODING })
    .then( data => data || 'null' )
    .then( json => JSON.parse(json) )
}

export function toHashableString( data = {} ){
  let json = JSON.stringify(data)
  const compressed = LZUTF8.compress(json, { outputEncoding: HASH_ENCODING })

  // Size monitoring - warn when approaching browser limits
  if (compressed.length > 60000) {
    console.warn(`[URL] Size: ${compressed.length} chars (approaching Firefox 65KB limit)`)
  }

  // Development metrics
  if (process.env.NODE_ENV === 'development') {
    const ratio = (100 * compressed.length / json.length).toFixed(1)
    console.log(`[URL] Compressed: ${json.length} → ${compressed.length} chars (${ratio}%)`)
  }

  return compressed
}
