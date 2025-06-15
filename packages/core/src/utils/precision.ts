import { Decimal } from '../lib/decimal'

/**
 * Rounds a number to 2 decimal places using Decimal.js for precision.
 *
 * @param value - The number to round
 * @returns The value rounded to 2 decimal places
 *
 * @example
 * roundEuros(1.005) // returns 1.01
 * roundEuros(1.004) // returns 1.00
 */
export function roundEuros(value: number): number {
  return new Decimal(value).toDP(2).toNumber()
}

/**
 * Asserts that a value is finite and positive.
 *
 * @param value - The value to check
 * @param name - The parameter name for error messages
 * @throws Error if the value is not finite or is negative
 */
export function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite positive number, got: ${value}`)
  }
}

/**
 * Asserts that a value is finite and positive, with an upper limit.
 *
 * @param value - The value to check
 * @param name - The parameter name for error messages
 * @param max - Maximum allowed value (default: 1,000,000)
 * @throws Error if the value is invalid
 */
export function assertValidSalary(value: number, name: string, max = 1_000_000): void {
  if (!Number.isFinite(value) || value < 0 || value > max) {
    throw new Error(`${name} must be a finite positive number ≤ ${max}, got: ${value}`)
  }
}

/**
 * Converts a percentage to a decimal rate.
 *
 * @param value - The percentage value (e.g., 20 for 20%)
 * @returns The decimal rate (e.g., 0.20)
 *
 * @example
 * percent(20) // returns 0.20
 * percent(15) // returns 0.15
 */
export const percent = (value: number): number => value / 100
