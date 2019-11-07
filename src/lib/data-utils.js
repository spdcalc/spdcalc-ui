export function createGroupedArray(arr, chunkSize){
  let groups = []
  let len = arr.length
  if ( arr instanceof Array ){
    for (let i = 0; i < len; i += chunkSize) {
      groups.push(arr.slice(i, i + chunkSize))
    }
  } else {
    let byteSize = arr.byteLength / chunkSize | 0
    let nGroups = len / chunkSize | 0
    for (let i = 0; i < nGroups; i++) {
      groups.push(new Float64Array(arr.buffer, i * byteSize, chunkSize))
    }
  }
  return groups
}
