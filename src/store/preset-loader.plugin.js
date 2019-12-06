import { fromHashString } from '@/lib/url-hash-utils'

export const presetLoaderPlugin = store => {

  store.watch((state, getters) => getters['presets/selected'], selected => {
    if ( !selected ){ return }

    return fromHashString(selected.data.parameters)
      .then( data => {
        if ( !data ){ return }
        store.commit('parameters/merge', data)
      })
      .catch( error => {
        store.dispatch('error', { error, context: 'while loading preset' })
      })
  })
}
