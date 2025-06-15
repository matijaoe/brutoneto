import { getDefaultTax, getPlacesMetadata } from '@brutoneto/core'

export default defineEventHandler(() => {
  return {
    defaultTax: getDefaultTax(),
    metadata: getPlacesMetadata(),
  }
})
