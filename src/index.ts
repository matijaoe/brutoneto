import { netToGross } from './calculations/gross'
import { grossToNet } from './calculations/net'

export * from './generated/places'

export {
  calcFinalNet,
  calcHealthInsuranceContribution,
  calcIncomeAfterDeductions,
  calcMandatoryPensionContribution,
  calcPersonalAllowance,
  calcTax,
  calcTaxableIncome,
  grossToTotal,
} from './calculations/salary'

export { detailedSalary, grossToNet } from './calculations/net'

export { netToGross } from './calculations/gross'

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
