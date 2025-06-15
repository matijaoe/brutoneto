import { getPlaces } from '@brutoneto/core'

export default defineEventHandler(() => {
  return getPlaces()
})