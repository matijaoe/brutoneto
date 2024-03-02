import { PlaceKey, PlaceTaxes } from './generated/places'

export const RATE = {
  /**
   * Pension contribution rate for the first pillar.
   * @note 1. mirovinski stup
   */
  PENSION_CONTRIBUTION_PILLAR_1: 0.15,
  /**
   * Pension contribution rate for the second pillar.
   * @note 2. mirovinski stup
   */
  PENSION_CONTRIBUTION_PILLAR_2: 0.05,
  /**
   * Health insurance contribution rate.
   * @note zdravstveno osiguranje
   */
  HEALTH_INSURANCE_CONTRIBUTION: 0.165,
  /**
   * Low tax bracket rate.
   * @note niža porezna stopa
   */
  TAX_LOW_BRACKET: 0.2,
  /**
   * High tax bracket rate.
   * @note viša porezna stopa
   */
  TAX_HIGH_BRACKET: 0.3,
} as const

/**
 * Threshold for the high tax bracket.
 * @note prag za višu poreznu stopu
 */
export const HIGH_TAX_BRACKET_THRESHOLD = 4200

/**
 * Basic personal allowance.
 * @note osnovni osobni odbitak
 */
export const BASIC_PERSONAL_ALLOWANCE = 560
/**
 * Coefficient for the personal allowance.
 * @note koeficijent osobnog odbitka
 */
export const PERSONAL_ALLOWANCE_COEFFICIENT = 1

/**
 * Calculates the total pension contribution based on the gross salary.
 * @param gross - The gross salary.
 * @returns Contributions per pension pillar and the total pension contribution.
 */
export function calcPensionContribution(gross: number) {
  const firstPilar = gross * RATE.PENSION_CONTRIBUTION_PILLAR_1
  const secondPillar = gross * RATE.PENSION_CONTRIBUTION_PILLAR_2
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
  const taxLower = Math.min(principal, HIGH_TAX_BRACKET_THRESHOLD) * taxRateLow
  const taxHigher = Math.max(
    (principal - HIGH_TAX_BRACKET_THRESHOLD) * taxRateHigh,
    0,
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
  return gross * RATE.HEALTH_INSURANCE_CONTRIBUTION
}

interface GrossToNetConfig {
  place?: PlaceKey
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
}

/**
 * Calculates the net income based on the gross income and optional configuration.
 *
 * @alias brutoToNeto
 *
 * @param gross - The gross income.
 * @param config - Optional configuration for tax rates and personal allowance coefficient.
 * @returns The net income.
 */
export function grossToNet(gross: number, config?: GrossToNetConfig): number {
  config ??= {}
  const {
    place,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config

  if (place && !PlaceTaxes[place]) {
    throw new Error(`Unknown place "${place}"`)
  }

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceTaxes[place] : config

  const { total: pensionContribution } = calcPensionContribution(gross)

  const income = calcIncomeAfterDeductions(gross, pensionContribution)

  const personalAllowance = calcPersonalAllowance(
    income,
    personalAllowanceCoefficient,
  )

  const taxableIncome = calcTaxableIncome(income, personalAllowance)

  const { total: taxes } = calcTax(taxableIncome, [taxRateLow, taxRateHigh])

  const net = calcFinalNet(income, taxes)

  return net
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

interface NetToGrossConfig {
  place?: PlaceKey
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
 */
export function netToGross(net: number, config?: NetToGrossConfig): number {
  config ??= {}
  const {
    place,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
    increment = 0.01,
  } = config

  if (place && !PlaceTaxes[place]) {
    throw new Error(`Unknown place "${place}"`)
  }

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceTaxes[place] : config

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

/**
 * Calculates the net income based on the gross income and optional configuration.
 *
 * @alias grossToNet
 *
 * @param gross - The gross income.
 * @param config - Optional configuration for tax rates and personal allowance coefficient.
 * @returns The net income.
 */
export const brutoToNeto = grossToNet

/**
 * Calculates the gross amount based on the given net amount.
 *
 * @alias netToGross
 *
 * @param net The net amount.
 * @param config Optional configuration object.
 * @returns The calculated gross amount.
 */
export const netoToBruto = netToGross

export function detailedSalary(gross: number, config?: GrossToNetConfig) {
  config ??= {}
  const {
    place,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config

  if (place && !PlaceTaxes[place]) {
    throw new Error(`Unknown place "${place}"`)
  }

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceTaxes[place] : config

  const {
    firstPilar,
    secondPillar,
    total: pensionContribution,
  } = calcPensionContribution(gross)

  const income = calcIncomeAfterDeductions(gross, pensionContribution)

  const personalAllowance = calcPersonalAllowance(
    income,
    personalAllowanceCoefficient,
  )

  const taxableIncome = calcTaxableIncome(income, personalAllowance)

  const {
    taxHigher,
    taxLower,
    total: taxes,
  } = calcTax(taxableIncome, [taxRateLow, taxRateHigh])

  const net = calcFinalNet(income, taxes)

  const { healthInsuranceContribution, total: grossTotal } = grossToTotal(gross)

  const netShareOfGross = parseFloat((net / gross).toFixed(2))
  const netShareOfTotal = parseFloat((net / grossTotal).toFixed(2))

  return {
    net,
    gross,
    grossTotal,
    pension: {
      firstPilar,
      secondPillar,
      total: pensionContribution,
    },
    income,
    taxes: {
      lowerBracket: taxLower,
      higherBracket: taxHigher,
      total: taxes,
    },
    healthInsurance: healthInsuranceContribution,
    taxableIncome,
    personalAllowance,
    variables: {
      place: place ?? null,
      taxRateLow,
      taxRateHigh,
      personalAllowanceCoefficient,
      basicPersonalAllowance: BASIC_PERSONAL_ALLOWANCE,
    },
    calculations: {
      netShareOfTotal,
      netShareOfGross,
    },
  }
}

console.log(grossToNet(3150, { place: 'sveta-nedelja-samobor' }))
console.log(detailedSalary(3150, { place: 'sveta-nedelja-samobor' }))
