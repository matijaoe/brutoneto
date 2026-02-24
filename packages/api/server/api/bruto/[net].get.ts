import type { Place } from '@brutoneto/core'
import {
  grossToTotal,
  MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
  MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
  netToGross,
} from '@brutoneto/core'
import { getQuery, getRouterParams } from 'h3'
import { z } from 'zod'
import { isValidPlaceWithShortcuts, resolvePlaceShortcut } from '~/utils/places'

const ParamsSchema = z.object({
  net: z.coerce.number().positive(),
})

const QuerySchema = z.object({
  place: z
    .string()
    .refine(isValidPlaceWithShortcuts, {
      message: 'Invalid place',
    })
    .optional(),
  ltax: z.coerce.number().min(0).max(0.99).optional(),
  htax: z.coerce.number().min(0).max(0.99).optional(),
  coeff: z
    .coerce
    .number()
    .min(MIN_PERSONAL_ALLOWANCE_COEFFICIENT)
    .max(MAX_PERSONAL_ALLOWANCE_COEFFICIENT)
    .optional(),
  detailed: z.coerce.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const routerParams = getRouterParams(event)
  const params = ParamsSchema.safeParse(routerParams)

  if (params.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid net amount',
      message: extractZodErrorMessage(params.error),
    })
  }

  const { net } = params.data

  const queryParams = getQuery(event)
  const query = QuerySchema.safeParse(queryParams)

  if (query.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameter(s)',
      message: extractZodErrorMessage(query.error),
    })
  }

  const { place, ltax, htax, coeff } = query.data

  // Resolve place shortcuts to full place names
  const resolvedPlace = place != null ? resolvePlaceShortcut(place) as Place : undefined

  const gross = netToGross(net, {
    place: resolvedPlace,
    taxRateLow: ltax,
    taxRateHigh: htax,
    personalAllowanceCoefficient: coeff,
  })
  const { total: totalCostToEmployer } = grossToTotal(gross)

  return {
    net,
    gross,
    totalCostToEmployer,
    currency: 'EUR',
  }
})
