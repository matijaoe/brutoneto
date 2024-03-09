import { PERSONAL_ALLOWANCE_COEFFICIENT, RATE } from '../constants'
import { Place, PlaceMap } from '../generated/places'
import { grossToNet } from './net'

type NetToGrossConfig = {
  place?: Place
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
  increment?: number
}

/**
 * Calculates the gross amount based on the given net amount.
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
    increment = 0.01,
  } = config

  if (place && !PlaceMap[place]) {
    throw new Error(`Unknown place "${place}"`)
  }

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceMap[place] : config

  let gross = net
  while (true) {
    const calculatedNet = grossToNet(gross, {
      taxRateLow,
      taxRateHigh,
      personalAllowanceCoefficient,
    })

    if (calculatedNet >= net) {
      break
    }

    gross += increment
  }

  return parseFloat(gross.toFixed(2))
}

