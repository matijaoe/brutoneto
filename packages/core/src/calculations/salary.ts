import {
  BASIC_PERSONAL_ALLOWANCE,
  HIGH_TAX_BRACKET_THRESHOLD,
  RATE,
} from '../constants'
import { Decimal } from '../lib/decimal'

/**
 * Calculates the total pension contribution based on the gross salary.
 * @param gross - The gross salary.
 * @returns Contributions per pension pillar and the total pension contribution.
 */
export function calcMandatoryPensionContribution(gross: number) {
  const grossDecimal = new Decimal(gross)
  const firstPillar = grossDecimal.mul(RATE.PENSION_CONTRIBUTION_PILLAR_1).toNumber()
  const secondPillar = grossDecimal.mul(RATE.PENSION_CONTRIBUTION_PILLAR_2).toNumber()
  const total = firstPillar + secondPillar

  return {
    firstPillar,
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
  return new Decimal(gross).sub(pensionContribution).toNumber()
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
  const personalAllowance = BASIC_PERSONAL_ALLOWANCE * coefficient
  return Math.min(income, personalAllowance)
}

/**
 * Calculates the taxable income by subtracting the personal allowance from the income.
 *
 * @note porezna osnovica
 *
 * @param income - The total income.
 * @param personalAllowance - The personal allowance.
 * @returns The taxable income.
 */
export function calcTaxableIncome(
  income: number,
  personalAllowance: number,
): number {
  return new Decimal(income).sub(personalAllowance).toNumber()
}

/**
 * Calculates the tax amount based on the principal amount and tax rates.
 *
 * @note porez
 *
 * @param principal - The principal amount.
 * @param taxRates - An array containing the low and high tax rates [taxRateLow, taxRateHigh].
 * @param taxRates."0" - The low tax rate.
 * @param taxRates."1" - The high tax rate.
 * @returns Tax amounts for the low and high tax brackets, and the total tax amount.
 */
export function calcTax(
  principal: number,
  [taxRateLow, taxRateHigh]: [number, number],
) {
  const $principal = new Decimal(principal)
  const threshold = new Decimal(HIGH_TAX_BRACKET_THRESHOLD)

  const lowerBracketAmount = $principal.lessThan(threshold) ? $principal : threshold
  const taxLower = lowerBracketAmount.mul(taxRateLow).toDP(2)

  const higherTaxPrincipal = $principal.sub(threshold)
  const taxableHigherAmount = higherTaxPrincipal.greaterThan(0) ? higherTaxPrincipal : new Decimal(0)
  const taxHigher = taxableHigherAmount.mul(taxRateHigh).toDP(2)

  const total = taxLower.add(taxHigher).toDP(2)

  return {
    taxLower: taxLower.toNumber(),
    taxHigher: taxHigher.toNumber(),
    total: total.toNumber(),
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
  return new Decimal(income).sub(taxes).toNumber()
}

/**
 * Calculates the health insurance contribution based on the gross income.
 *
 * @param gross - The gross income.
 * @returns The calculated health insurance contribution.
 */
export function calcHealthInsuranceContribution(gross: number): number {
  return new Decimal(gross).mul(RATE.HEALTH_INSURANCE_CONTRIBUTION).toNumber()
}

/**
 * Calculates the gross (bruto 1) amount from the total cost to employer (bruto 2).
 * Reverse of grossToTotal.
 *
 * @note bruto 2 u bruto 1
 *
 * @param total - The total cost to employer (bruto 2).
 * @returns The gross (bruto 1) amount.
 */
export function totalToGross(total: number): number {
  return new Decimal(total)
    .div(new Decimal(1).add(RATE.HEALTH_INSURANCE_CONTRIBUTION))
    .toDP(2)
    .toNumber()
}

/**
 * Calculates the total amount by adding the gross amount and the health insurance contribution.
 *
 * @param gross - The gross amount.
 * @returns The health insurance contribution and the total gross amount.
 */
export function grossToTotal(gross: number) {
  const grossDecimal = new Decimal(gross)
  const healthInsuranceContribution = grossDecimal.mul(RATE.HEALTH_INSURANCE_CONTRIBUTION).toDP(2)
  const total = grossDecimal.add(healthInsuranceContribution).toDP(2)

  return {
    healthInsuranceContribution: healthInsuranceContribution.toNumber(),
    total: total.toNumber(),
  }
}
