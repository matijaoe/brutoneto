import { PERSONAL_ALLOWANCE_COEFFICIENT, RATE } from '../constants'
import type { Place } from '../data/places'
import { PlaceMap } from '../data/places'
import { toDecimal } from '../utils'
import { grossToNet } from './gross-to-net'

export type NetToGrossConfig = {
  place?: Place
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
}

/**
 * Calculates the gross amount based on the given net amount.
 *
 * Using binary search to find the gross amount.
 *
 * @alias netoToBruto
 *
 * @param net The net amount.
 * @param config Optional configuration object.
 * @returns The calculated gross amount.
 * @throws Error if the place specified in the configuration is unknown.
 */
export function netToGross(net: number, config?: NetToGrossConfig): number {
  config ??= {}
  const {
    place,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config ?? {}

  if (place && !PlaceMap[place]) {
    throw new Error(`Unknown place "${place}"`)
  }

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceMap[place] : config

  let lowerBound = toDecimal(0)
  let upperBound = toDecimal(net * 2) // Assuming gross will not be more than twice the net
  let gross = lowerBound

  while (upperBound.minus(lowerBound).greaterThan(0.01)) {
    // Stop if the difference is less than 1 cent
    gross = lowerBound.plus(upperBound).dividedBy(2)
    const calculatedNet = grossToNet(gross.toNumber(), {
      taxRateLow,
      taxRateHigh,
      personalAllowanceCoefficient,
    })

    if (calculatedNet < net) {
      lowerBound = gross
    } else {
      upperBound = gross
    }
  }

  return gross.toDP(2).toNumber()
}