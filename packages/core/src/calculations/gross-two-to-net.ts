import type { SalaryConfig } from './gross-to-net'
import { assertValidSalary } from '../utils/precision'
import { grossToNet, grossToNetBreakdown } from './gross-to-net'
import { totalToGross } from './salary'

/**
 * Calculates the net income from the total cost to employer (bruto 2).
 *
 * @alias bruto2ToNeto
 *
 * @param totalCost - The total cost to employer (bruto 2) in euros.
 * @param config - Optional configuration for tax rates and personal allowance coefficient.
 * @returns The net income in euros (rounded to 2 decimal places).
 *
 * @example
 * const net = grossTwoToNet(4660) // gross1 ≈ 4000, net ≈ 2680
 */
export function grossTwoToNet(totalCost: number, config: SalaryConfig = {}): number {
  assertValidSalary(totalCost, 'totalCostToEmployer', 1_165_000)
  const gross = totalToGross(totalCost)
  return grossToNet(gross, config)
}

/**
 * Calculates comprehensive salary breakdown from the total cost to employer (bruto 2).
 *
 * @param totalCost - The total cost to employer (bruto 2) in euros.
 * @param config - Optional configuration object.
 * @returns An object containing detailed salary breakdown.
 */
export function grossTwoToNetBreakdown(totalCost: number, config: SalaryConfig = {}) {
  assertValidSalary(totalCost, 'totalCostToEmployer', 1_165_000)
  const gross = totalToGross(totalCost)
  return grossToNetBreakdown(gross, config)
}
