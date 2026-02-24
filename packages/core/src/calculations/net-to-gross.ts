import type { Place } from '../data/places'
import { BASIC_PERSONAL_ALLOWANCE, HIGH_TAX_BRACKET_THRESHOLD, PERSONAL_ALLOWANCE_COEFFICIENT, RATE } from '../constants'
import { PlaceMap } from '../data/places'
import { assertValidSalary, roundEuros } from '../utils/precision'
import { grossToNet } from './gross-to-net'

export interface NetToGrossConfig {
  place?: Place
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
}

interface ForwardConfig {
  place?: Place
  taxRateLow: number
  taxRateHigh: number
  personalAllowanceCoefficient: number
}

/**
 * Finds the gross value that produces the target net by verifying the
 * closed-form estimate against grossToNet and correcting if needed.
 *
 * Uses a fast local search first (±0.05 EUR), then falls back to binary
 * search for edge cases near bracket boundaries or the no-tax zone.
 */
function correctEstimate(
  estimate: number,
  targetNet: number,
  config: ForwardConfig,
): number {
  const clamped = Math.max(0, estimate)
  const rounded = roundEuros(clamped)

  // Fast path: estimate is already correct
  if (grossToNet(rounded, config) === targetNet) {
    return rounded
  }

  // Quick local search (covers ±0.05 EUR around estimate)
  for (let i = 1; i <= 5; i++) {
    const delta = i * 0.01
    for (const candidate of [roundEuros(clamped + delta), roundEuros(clamped - delta)]) {
      if (candidate >= 0 && grossToNet(candidate, config) === targetNet) {
        return candidate
      }
    }
  }

  // Binary search fallback for larger deviations (bracket boundaries, no-tax zone)
  let lo = 0
  let hi = 1_000_000

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const midNet = grossToNet(roundEuros(mid), config)
    if (midNet < targetNet) {
      lo = mid
    }
    else {
      hi = mid
    }
    if (hi - lo < 0.005)
      break
  }

  // Check the converged value and its neighbors
  const center = roundEuros((lo + hi) / 2)
  const candidates = [
    roundEuros(center - 0.01),
    center,
    roundEuros(center + 0.01),
  ].filter(c => c >= 0)

  let best = candidates[0]!
  let bestDiff = Math.abs(grossToNet(best, config) - targetNet)

  for (const c of candidates) {
    const diff = Math.abs(grossToNet(c, config) - targetNet)
    if (diff < bestDiff || (diff === bestDiff && c < best)) {
      bestDiff = diff
      best = c
    }
  }

  return best
}

/**
 * Calculates the gross amount based on the given net amount.
 *
 * Uses a closed-form algebraic inversion as an initial estimate, then
 * verifies against grossToNet and corrects for intermediate rounding
 * to guarantee an exact roundtrip: netToGross(grossToNet(G)) === G.
 *
 * @alias netoToBruto
 *
 * @param net - The net amount in euros (will be rounded to 2 decimal places).
 * @param config - Optional configuration object.
 * @returns The calculated gross amount in euros (rounded to 2 decimal places).
 * @throws Error if the place specified in the configuration is unknown.
 *
 * @example
 * const gross = netToGross(2000) // returns 2777.78
 * const gross = netToGross(1500.005) // returns 2083.34 (rounds to 2dp)
 */
export function netToGross(
  net: number,
  config: NetToGrossConfig = {},
): number {
  assertValidSalary(net, 'net')

  if (net === 0)
    return 0

  const {
    place,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config

  if (place && !(place in PlaceMap)) {
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

  /* ---------- bracket boundaries ---------- */

  // No-tax zone: income <= allowance → tax = 0 → net = income = gross*(1-contrib)
  // Boundary: net = allowance
  const netNoTax = allowance

  // Low bracket ceiling: taxableIncome = threshold
  const grossAtLimit = (threshold + allowance) / (1 - contributionRate)
  const netAtLimit
    = grossAtLimit * (1 - contributionRate) * (1 - taxRateLow)
      + allowance * taxRateLow

  /* ---------- closed-form estimate (three regions) ---------- */
  let estimate: number

  if (net <= netNoTax) {
    // No-tax zone: net = gross * (1 - contributionRate)
    estimate = net / (1 - contributionRate)
  }
  else if (net <= netAtLimit) {
    // Low-rate bracket: N = A·G + B
    const A = (1 - contributionRate) * (1 - taxRateLow)
    const B = allowance * taxRateLow
    estimate = (net - B) / A
  }
  else {
    // High-rate bracket: N = A·G + B
    const A = (1 - contributionRate) * (1 - taxRateHigh)
    const B = allowance * taxRateHigh
      - threshold * (taxRateLow - taxRateHigh)
    estimate = (net - B) / A
  }

  /* ---------- verify and correct for intermediate rounding ---------- */
  const forwardConfig: ForwardConfig = {
    place,
    taxRateLow,
    taxRateHigh,
    personalAllowanceCoefficient,
  }

  return correctEstimate(estimate, net, forwardConfig)
}
