import { z } from 'zod'
import {
  MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
  MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
  isValidPlace,
  netToGross,
} from '@brutoneto/core'

const ParamsSchema = z.object({
  net: z.number({ coerce: true }).positive(),
})

const QuerySchema = z.object({
  place: z
    .string()
    .refine(isValidPlace, {
      message: 'Invalid place',
    })
    .optional(),
  ltax: z.number({ coerce: true }).min(0).max(0.99).optional(),
  htax: z.number({ coerce: true }).min(0).max(0.99).optional(),
  coeff: z
    .number({ coerce: true })
    .min(MIN_PERSONAL_ALLOWANCE_COEFFICIENT)
    .max(MAX_PERSONAL_ALLOWANCE_COEFFICIENT)
    .optional(),
  detailed: z.boolean({ coerce: true }).optional(),
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, ParamsSchema.safeParse)

  if (params.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid net amount',
      message: extractZodErrorMessage(params.error),
    })
  }

  const { net } = params.data

  const query = await getValidatedQuery(event, QuerySchema.safeParse)

  if (query.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameter(s)',
      message: extractZodErrorMessage(query.error),
    })
  }

  const { place, ltax, htax, coeff } = query.data

  const gross = netToGross(net, {
    place,
    taxRateLow: ltax,
    taxRateHigh: htax,
    personalAllowanceCoefficient: coeff,
  })

  return {
    net,
    gross,
    currency: 'EUR',
  }
})