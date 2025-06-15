import { getPlaces, getPlacesMetadata } from '@brutoneto/core'

export default defineEventHandler(() => {
  return {
    places: getPlaces(),
    metadata: getPlacesMetadata(),
  }
})
