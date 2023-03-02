export function createGroupedArray(arr, chunkSize){
  let groups = []
  let len = arr.length
  if ( arr instanceof Array ){
    for (let i = 0; i < len; i += chunkSize) {
      groups.push(arr.slice(i, i + chunkSize))
    }
  } else if (ArrayBuffer.isView(arr)) {
    for (let i = 0; i < len; i += chunkSize) {
      groups.push(arr.subarray(i, i + chunkSize))
    }
  }
  return groups
}
