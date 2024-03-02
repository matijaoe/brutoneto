export type Rate = {
  PENSION_CONTRIBUTION_PILLAR_1: number
  PENSION_CONTRIBUTION_PILLAR_2: number
  HEALTH_INSURANCE_CONTRIBUTION: number
  TAX_LOW_BRACKET: number
  TAX_HIGH_BRACKET: number
}

export const RATE: Rate = {
  PENSION_CONTRIBUTION_PILLAR_1: 0.15,
  PENSION_CONTRIBUTION_PILLAR_2: 0.05,
  HEALTH_INSURANCE_CONTRIBUTION: 0.165,
  TAX_LOW_BRACKET: 0.2,
  TAX_HIGH_BRACKET: 0.3,
} as const

export const HIGH_TAX_BRACKET_THREASHOLD = 4200
export const BASIC_PERSONAL_ALLOWANCE = 560
export const PERSONAL_ALLOWANCE_COEFFICIENT = 1

export function calculatePensionContribution(gross: number): number {
  const firstPilar = gross * RATE.PENSION_CONTRIBUTION_PILLAR_1
  const secondPillar = gross * RATE.PENSION_CONTRIBUTION_PILLAR_2
  return firstPilar + secondPillar
}

export function calculateIncomeAfterDeductions(
  gross: number,
  pensionContribution: number
): number {
  return gross - pensionContribution
}

export function calculatePersonalAllowance(
  income: number,
  coefficient: number
): number {
  return Math.min(income, BASIC_PERSONAL_ALLOWANCE * coefficient)
}

export function calculateTaxableIncome(
  income: number,
  personalAllowance: number
): number {
  return income - personalAllowance
}

export function calculateTax(
  principal: number,
  taxRateLow: number,
  taxRateHigh: number
): number {
  const taxLowerBracket =
    Math.min(principal, HIGH_TAX_BRACKET_THREASHOLD) * taxRateLow
  const taxHigherBracket = Math.max(
    (principal - HIGH_TAX_BRACKET_THREASHOLD) * taxRateHigh,
    0
  )
  return taxLowerBracket + taxHigherBracket
}

export function calculateFinalNet(income: number, taxes: number): number {
  return income - taxes
}

export function calculateHealthInsuranceContribution(gross: number): number {
  return gross * RATE.HEALTH_INSURANCE_CONTRIBUTION
}

export function calculateNetSalary(
  gross: number,
  taxRateLow = RATE.TAX_LOW_BRACKET,
  taxRateHigh = RATE.TAX_HIGH_BRACKET,
  personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT
): number {
  const pensionContribution = calculatePensionContribution(gross)
  const income = calculateIncomeAfterDeductions(gross, pensionContribution)
  const personalAllowance = calculatePersonalAllowance(
    income,
    personalAllowanceCoefficient
  )
  const taxableIncome = calculateTaxableIncome(income, personalAllowance)
  const taxes = calculateTax(taxableIncome, taxRateLow, taxRateHigh)
  const net = calculateFinalNet(income, taxes)
  return net
}

export function brutoToBruto2(gross: number): number {
  const healthInsuranceContribution =
    calculateHealthInsuranceContribution(gross)
  return gross + healthInsuranceContribution
}

export const brutoNeto = calculateNetSalary
