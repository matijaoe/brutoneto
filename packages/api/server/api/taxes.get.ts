import { getPlacesMetadata, getPlacesTaxes } from '@brutoneto/core'

export default defineEventHandler(() => {
  const placesTaxes = getPlacesTaxes()

  // Transform data to include keys, names, and taxes
  const places = Object.entries(placesTaxes).map(([key, data]) => ({
    key,
    name: data.name,
    taxRateLow: data.taxRateLow,
    taxRateHigh: data.taxRateHigh,
  }))

  return {
    places,
    metadata: getPlacesMetadata(),
  }
})