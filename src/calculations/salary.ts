import {
  BASIC_PERSONAL_ALLOWANCE,
  HIGH_TAX_BRACKET_THRESHOLD,
  RATE,
} from '../constants'
import { ensureFloat } from '../utils'

/**
 * Calculates the total pension contribution based on the gross salary.
 * @param gross - The gross salary.
 * @returns Contributions per pension pillar and the total pension contribution.
 */
export function calcMandatoryPensionContribution(gross: number) {
  const firstPilar = ensureFloat(gross * RATE.PENSION_CONTRIBUTION_PILLAR_1)
  const secondPillar = ensureFloat(gross * RATE.PENSION_CONTRIBUTION_PILLAR_2)

  const total = firstPilar + secondPillar

  return {
    firstPilar,
    secondPillar,
    total,
  }
}

/**
 * Calculates the income after deducting the pension contribution from the gross income.
 *
 * @param gross - The gross income.
 * @param pensionContribution - The pension contribution amount.
 * @returns The income after deducting the pension contribution.
 */
export function calcIncomeAfterDeductions(
  gross: number,
  pensionContribution: number,
): number {
  return gross - pensionContribution
}

/**
 * Calculates the personal allowance based on the income and coefficient.
 * The personal allowance is the minimum value between the income and the basic personal allowance multiplied by the coefficient.
 *
 * @note osobni odbitak
 *
 * @param income - The income value.
 * @param coefficient - The coefficient value.
 * @returns The calculated personal allowance.
 */
export function calcPersonalAllowance(
  income: number,
  coefficient: number,
): number {
  return Math.min(income, BASIC_PERSONAL_ALLOWANCE * coefficient)
}

/**
 * Calculates the taxable income by subtracting the personal allowance from the income.
 *
 * @note porezna osnovica
 *
 * @param {number} income - The total income.
 * @param {number} personalAllowance - The personal allowance.
 * @returns {number} The taxable income.
 */
export function calcTaxableIncome(
  income: number,
  personalAllowance: number,
): number {
  return income - personalAllowance
}

/**
 * Calculates the tax amount based on the principal amount and tax rates.
 *
 * @note porez
 *
 * @param principal - The principal amount.
 * @param taxRates - An array containing the low and high tax rates.
 * @returns Tax amounts for the low and high tax brackets, and the total tax amount.
 */
export function calcTax(
  principal: number,
  [taxRateLow, taxRateHigh]: [number, number],
) {
  const taxLower = ensureFloat(
    Math.min(principal, HIGH_TAX_BRACKET_THRESHOLD) * taxRateLow,
  )
  const taxHigher = ensureFloat(
    Math.max((principal - HIGH_TAX_BRACKET_THRESHOLD) * taxRateHigh, 0),
  )
  const total = taxLower + taxHigher
  return {
    taxLower,
    taxHigher,
    total,
  }
}

/**
 * Calculates the final net income by subtracting the taxes from the income.
 *
 * @note neto
 *
 * @param income - The total income.
 * @param taxes - The amount of taxes to be deducted.
 * @returns The final net income after deducting the taxes.
 */
export function calcFinalNet(income: number, taxes: number): number {
  return income - taxes
}

/**
 * Calculates the health insurance contribution based on the gross income.
 *
 * @param gross - The gross income.
 * @returns The calculated health insurance contribution.
 */
export function calcHealthInsuranceContribution(gross: number): number {
  return ensureFloat(gross * RATE.HEALTH_INSURANCE_CONTRIBUTION)
}

/**
 * Calculates the total amount by adding the gross amount and the health insurance contribution.
 *
 * @param gross - The gross amount.
 * @returns The health insurance contribution and the total gross amount.
 */
export function grossToTotal(gross: number) {
  const healthInsuranceContribution = calcHealthInsuranceContribution(gross)
  return {
    healthInsuranceContribution,
    total: gross + healthInsuranceContribution,
  }
}
