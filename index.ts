export const RATE = {
  PENSION_CONTRIBUTION_PILLAR_1: 0.15,
  PENSION_CONTRIBUTION_PILLAR_2: 0.05,
  HEALTH_INSURANCE_CONTRIBUTION: 0.165,
  TAX_LOW_BRACKET: 0.2,
  TAX_HIGH_BRACKET: 0.3,
} as const

export const HIGH_TAX_BRACKET_THRESHOLD = 4200
export const BASIC_PERSONAL_ALLOWANCE = 560
export const PERSONAL_ALLOWANCE_COEFFICIENT = 1

export function calcPensionContribution(gross: number): number {
  const firstPilar = gross * RATE.PENSION_CONTRIBUTION_PILLAR_1
  const secondPillar = gross * RATE.PENSION_CONTRIBUTION_PILLAR_2
  return firstPilar + secondPillar
}

export function calcIncomeAfterDeductions(
  gross: number,
  pensionContribution: number
): number {
  return gross - pensionContribution
}

export function calcPersonalAllowance(
  income: number,
  coefficient: number
): number {
  return Math.min(income, BASIC_PERSONAL_ALLOWANCE * coefficient)
}

export function calcTaxableIncome(
  income: number,
  personalAllowance: number
): number {
  return income - personalAllowance
}

export function calcTax(
  principal: number,
  taxRateLow: number,
  taxRateHigh: number
): number {
  const taxLower = Math.min(principal, HIGH_TAX_BRACKET_THRESHOLD) * taxRateLow
  const taxHigher = Math.max(
    (principal - HIGH_TAX_BRACKET_THRESHOLD) * taxRateHigh,
    0
  )
  return taxLower + taxHigher
}

export function calcFinalNet(income: number, taxes: number): number {
  return income - taxes
}

export function calcHealthInsuranceContribution(gross: number): number {
  return gross * RATE.HEALTH_INSURANCE_CONTRIBUTION
}

export function grossToNet(
  gross: number,
  taxRateLow: number = RATE.TAX_LOW_BRACKET,
  taxRateHigh: number = RATE.TAX_HIGH_BRACKET,
  personalAllowanceCoefficient: number = PERSONAL_ALLOWANCE_COEFFICIENT
): number {
  const pensionContribution = calcPensionContribution(gross)
  const income = calcIncomeAfterDeductions(gross, pensionContribution)
  const personalAllowance = calcPersonalAllowance(
    income,
    personalAllowanceCoefficient
  )
  const taxableIncome = calcTaxableIncome(income, personalAllowance)
  const taxes = calcTax(taxableIncome, taxRateLow, taxRateHigh)
  const net = calcFinalNet(income, taxes)
  return net
}

export function grossToTotal(gross: number): number {
  const healthInsuranceContribution = calcHealthInsuranceContribution(gross)
  return gross + healthInsuranceContribution
}

export function netToGross(
  net: number,
  taxRateLow: number = RATE.TAX_LOW_BRACKET,
  taxRateHigh: number = RATE.TAX_HIGH_BRACKET,
  personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  increment = 0.01
): number {
  let gross = net
  while (true) {
    const calculatedNet = grossToNet(
      gross,
      taxRateLow,
      taxRateHigh,
      personalAllowanceCoefficient
    )
    if (calculatedNet < net) {
      gross += increment
    } else {
      break
    }
  }
  return parseFloat(gross.toFixed(2))
}

// Croatian aliases
export const bruto2Neto = grossToNet
export const neto2Bruto = netToGross
