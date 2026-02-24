import type { Place, SalaryConfig } from '@brutoneto/core'
import {
  grossTwoToNet,
  grossTwoToNetBreakdown,
  MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
  MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
  roundEuros,
  THIRD_PILLAR_NON_TAXABLE_LIMIT,
  totalToGross,
} from '@brutoneto/core'
import { getQuery, getRouterParams } from 'h3'
import { z } from 'zod'
import { isValidPlaceWithShortcuts, resolvePlaceShortcut } from '~/utils/places'

const ParamsSchema = z.object({
  grossTwo: z.coerce.number().positive(),
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
  third_pillar: z
    .coerce
    .number()
    .min(0)
    .max(THIRD_PILLAR_NON_TAXABLE_LIMIT, {
      message: `Maximum allowed non-taxable monthly third pillar contribution is €${THIRD_PILLAR_NON_TAXABLE_LIMIT}`,
    })
    .optional(),
  detailed: z.coerce.boolean().optional(),
  yearly: z.coerce.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const routerParams = getRouterParams(event)
  const params = ParamsSchema.safeParse(routerParams)

  if (params.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid gross two amount',
      message: extractZodErrorMessage(params.error),
    })
  }

  const { grossTwo } = params.data

  const queryParams = getQuery(event)
  const query = QuerySchema.safeParse(queryParams)

  if (query.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameter(s)',
      message: extractZodErrorMessage(query.error),
    })
  }

  const { place, ltax, htax, coeff, third_pillar, detailed, yearly } = query.data

  const monthlyGrossTwo = yearly === true ? roundEuros(grossTwo / 12) : grossTwo

  const resolvedPlace = place != null ? resolvePlaceShortcut(place) as Place : undefined

  const config: SalaryConfig = {
    place: resolvedPlace,
    taxRateLow: ltax,
    taxRateHigh: htax,
    personalAllowanceCoefficient: coeff,
    thirdPillarContribution: third_pillar,
  }

  if (detailed === true) {
    const res = grossTwoToNetBreakdown(monthlyGrossTwo, config)
    return {
      ...res,
      currency: 'EUR',
    }
  }

  const net = grossTwoToNet(monthlyGrossTwo, config)
  const gross = totalToGross(monthlyGrossTwo)

  return {
    totalCostToEmployer: monthlyGrossTwo,
    gross,
    net,
    currency: 'EUR',
  }
})
