import type { SalaryConfig } from './gross-to-net'
import { RATE } from '../constants'
import { Decimal } from '../lib/decimal'
import { assertValidSalary, roundEuros } from '../utils/precision'
import { grossToNet, grossToNetBreakdown } from './gross-to-net'
import { totalToGross } from './salary'

/**
 * Calculates the net income from the total cost to employer (bruto 2).
 *
 * @alias bruto2ToNeto
 *
 * @param grossTwo - The total cost to employer (bruto 2) in euros.
 * @param config - Optional configuration for tax rates and personal allowance coefficient.
 * @returns The net income in euros (rounded to 2 decimal places).
 *
 * @example
 * const net = grossTwoToNet(4660) // gross1 ≈ 4000, net ≈ 2680
 */
export function grossTwoToNet(grossTwo: number, config: SalaryConfig = {}): number {
  assertValidSalary(grossTwo, 'grossTwo', 1_165_000)
  const gross = totalToGross(grossTwo)
  return grossToNet(gross, config)
}

/**
 * Calculates comprehensive salary breakdown from the total cost to employer (bruto 2).
 *
 * @param grossTwo - The total cost to employer (bruto 2) in euros.
 * @param config - Optional configuration object.
 * @returns An object containing detailed salary breakdown including the original grossTwo input.
 */
export function grossTwoToNetBreakdown(grossTwo: number, config: SalaryConfig = {}) {
  assertValidSalary(grossTwo, 'grossTwo', 1_165_000)
  const gross = totalToGross(grossTwo)
  const breakdown = grossToNetBreakdown(gross, config)

  return {
    ...breakdown,
    grossTwo: roundEuros(grossTwo),
  }
}
