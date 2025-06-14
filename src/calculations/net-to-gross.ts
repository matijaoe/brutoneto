import { Decimal } from '../lib/decimal'
import { BASIC_PERSONAL_ALLOWANCE, HIGH_TAX_BRACKET_THRESHOLD, PERSONAL_ALLOWANCE_COEFFICIENT, RATE } from '../constants'
import type { Place } from '../data/places'
import { PlaceMap } from '../data/places'

export type NetToGrossConfig = {
  place?: Place
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
}

/**
 * Calculates the gross amount based on the given net amount.
 *
 * Exact, closed-form inversion of grossToNet.
 * Pass values in €, get gross in € (rounded to two decimals).
 *
 * @alias netoToBruto
 *
 * @param net The net amount.
 * @param config Optional configuration object.
 * @returns The calculated gross amount.
 * @throws Error if the place specified in the configuration is unknown.
 */
export function netToGross(
  net: number,
  config: NetToGrossConfig = {},
): number {
  const {
    place,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config

  if (place && !PlaceMap[place]) {
    throw new Error(`Unknown place "${place}"`)
  }

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceMap[place] : config

  /* ---------- fixed parameters ---------- */
  const contributionRate
    = RATE.PENSION_CONTRIBUTION_PILLAR_1
    + RATE.PENSION_CONTRIBUTION_PILLAR_2
  const allowance = BASIC_PERSONAL_ALLOWANCE * personalAllowanceCoefficient
  const threshold = HIGH_TAX_BRACKET_THRESHOLD

  /* ---------- net at the bracket frontier ---------- */
  const grossAtLimit = (threshold + allowance) / (1 - contributionRate)
  const netAtLimit
    = grossAtLimit * (1 - contributionRate) * (1 - taxRateLow)
    + allowance * taxRateLow

  /* ---------- solve N = A·G + B ---------- */
  let gross: number

  if (net <= netAtLimit) {
    // low-rate bracket
    const A = (1 - contributionRate) * (1 - taxRateLow)
    const B = allowance * taxRateLow
    gross = (net - B) / A
  } else {
    // high-rate bracket
    const A = (1 - contributionRate) * (1 - taxRateHigh)
    const B = allowance * taxRateHigh
      - threshold * (taxRateLow - taxRateHigh)
    gross = (net - B) / A
  }

  // round to euro-cents
  return new Decimal(gross).toDP(2).toNumber()
}
