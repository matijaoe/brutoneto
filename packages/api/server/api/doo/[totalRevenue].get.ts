import type { DooConfig, NonTaxableBenefitsConfig, Place } from '@brutoneto/core'
import {
  calculateDoo,
  DIRECTOR_MINIMUM_GROSS,
  MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
  MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
  roundEuros,
  THIRD_PILLAR_NON_TAXABLE_LIMIT,
} from '@brutoneto/core'
import { getQuery, getRouterParams } from 'h3'
import { z } from 'zod'
import { isValidPlaceWithShortcuts, resolvePlaceShortcut } from '~/utils/places'

const ParamsSchema = z.object({
  totalRevenue: z.coerce.number().positive(),
})

const QuerySchema = z.object({
  salary_gross: z.coerce.number().positive().optional(),
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
  dividend_percent: z.coerce.number().min(0).max(100).optional(),
  tax_return_percent: z.coerce.number().min(0).max(100).optional(),
  detailed: z.coerce.boolean().optional(),
  yearly: z.coerce.boolean().optional(),
  // Non-taxable benefits ("neoporezivi primici")
  benefit_nagrade: z.coerce.boolean().optional(),
  benefit_results: z.coerce.boolean().optional(),
  benefit_meal: z.enum(['off', 'pausal', 'racuni']).optional(),
  benefit_remote: z.coerce.boolean().optional(),
  benefit_vacation: z.coerce.boolean().optional(),
  benefit_health: z.coerce.boolean().optional(),
  benefit_pension: z.coerce.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const routerParams = getRouterParams(event)
  const params = ParamsSchema.safeParse(routerParams)

  if (params.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid total revenue amount',
      message: extractZodErrorMessage(params.error),
    })
  }

  const { totalRevenue } = params.data

  const queryParams = getQuery(event)
  const query = QuerySchema.safeParse(queryParams)

  if (query.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameter(s)',
      message: extractZodErrorMessage(query.error),
    })
  }

  const {
    salary_gross,
    place,
    ltax,
    htax,
    coeff,
    third_pillar,
    dividend_percent,
    tax_return_percent,
    detailed,
    yearly,
    benefit_nagrade,
    benefit_results,
    benefit_meal,
    benefit_remote,
    benefit_vacation,
    benefit_health,
    benefit_pension,
  } = query.data

  const monthlyRevenue = yearly === true ? roundEuros(totalRevenue / 12) : totalRevenue

  const resolvedPlace = place != null ? resolvePlaceShortcut(place) as Place : undefined

  const benefits: NonTaxableBenefitsConfig | undefined = (
    benefit_nagrade || benefit_results || benefit_meal != null
    || benefit_remote || benefit_vacation || benefit_health || benefit_pension
  )
    ? {
        prigodneNagrade: benefit_nagrade,
        nagradaZaRezultate: benefit_results,
        prehrana: benefit_meal,
        radOdKuce: benefit_remote,
        odmorRadnika: benefit_vacation,
        dopunskoZdravstveno: benefit_health,
        treciStup: benefit_pension,
      }
    : undefined

  const dooConfig: DooConfig = {
    directorGross: salary_gross ?? DIRECTOR_MINIMUM_GROSS,
    place: resolvedPlace,
    taxRateLow: ltax,
    taxRateHigh: htax,
    personalAllowanceCoefficient: coeff,
    thirdPillarContribution: third_pillar,
    dividendPercentage: dividend_percent,
    taxReturnPercentage: tax_return_percent,
    benefits,
  }

  if (detailed === true) {
    const res = calculateDoo(monthlyRevenue, dooConfig)
    return {
      ...res,
      currency: 'EUR',
    }
  }

  const res = calculateDoo(monthlyRevenue, dooConfig)
  return {
    totalRevenue: monthlyRevenue,
    directorGross: res.directorGross,
    netSalary: res.totals.netSalary,
    netDividend: res.totals.netDividend,
    total: res.totals.monthlyNet,
    currency: 'EUR',
  }
})
