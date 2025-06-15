import { getPlaceTax, getPlacesMetadata, isValidPlace } from '@brutoneto/core'
import { z } from 'zod'

const ParamsSchema = z.object({
  place: z
    .string()
    .refine(isValidPlace, {
      message: 'Invalid place',
    }),
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, ParamsSchema.safeParse)

  if (params.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid place',
      message: extractZodErrorMessage(params.error),
    })
  }

  const { place } = params.data
  const placeTax = getPlaceTax(place)

  return {
    place: {
      key: place,
      name: placeTax.name,
      taxRateLow: placeTax.taxRateLow,
      taxRateHigh: placeTax.taxRateHigh,
    },
    metadata: getPlacesMetadata(),
  }
})
