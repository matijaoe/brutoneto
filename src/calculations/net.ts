import {
  BASIC_PERSONAL_ALLOWANCE,
  PERSONAL_ALLOWANCE_COEFFICIENT,
  RATE,
  THIRD_PILLAR_NON_TAXABLE_LIMIT,
} from '../constants'
import { Place, PlaceMap } from '../generated/places'
import { ensureFloat } from '../utils'
import {
  calcFinalNet,
  calcIncomeAfterDeductions,
  calcMandatoryPensionContribution,
  calcPersonalAllowance,
  calcTax,
  calcTaxableIncome,
  grossToTotal,
} from './salary'

type GrossToNetConfig = {
  place?: Place
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
  thirdPillarContribution?: number
}

/**
 * Calculates the net income based on the gross income and optional configuration.
 *
 * @alias brutoToNeto
 *
 * @param gross - The gross income.
 * @param config - Optional configuration for tax rates and personal allowance coefficient.
 * @returns The net income.
 * @throws Error if the place specified in the configuration is unknown.
 */
export function grossToNet(gross: number, config?: GrossToNetConfig): number {
  config ??= {}
  const {
    place,
    thirdPillarContribution = 0,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config

  if (place && !PlaceMap[place]) {
    throw new Error(`Unknown place "${place}"`)
  }

  if (
    !(
      thirdPillarContribution >= 0 &&
      thirdPillarContribution <= THIRD_PILLAR_NON_TAXABLE_LIMIT
    )
  ) {
    throw new Error(
      `Third pillar contribution can't be negative and must be up to ${THIRD_PILLAR_NON_TAXABLE_LIMIT}. Got: ${thirdPillarContribution}.`,
    )
  }

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceMap[place] : config

  const realGross = gross - thirdPillarContribution

  const { total: pensionContribution } =
    calcMandatoryPensionContribution(realGross)

  const income = calcIncomeAfterDeductions(realGross, pensionContribution)

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
 * Calculates the detailed salary information based on the gross salary and optional configuration.
 *
 * @param gross - The gross salary amount.
 * @param config - Optional configuration object.
 * @returns An object containing detailed salary information.
 * @throws Error if the place specified in the configuration is unknown.
 */
export function detailedSalary(gross: number, config?: GrossToNetConfig) {
  config ??= {}
  const {
    place,
    thirdPillarContribution = 0,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config

  if (place && !PlaceMap[place]) {
    throw new Error(`Unknown place "${place}"`)
  }

  if (
    !(
      thirdPillarContribution >= 0 &&
      thirdPillarContribution <= THIRD_PILLAR_NON_TAXABLE_LIMIT
    )
  ) {
    throw new Error(
      `Third pillar contribution can't be negative and must be up to ${THIRD_PILLAR_NON_TAXABLE_LIMIT}. Got: ${thirdPillarContribution}`,
    )
  }

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceMap[place] : config

  const {
    firstPilar,
    secondPillar,
    total: pensionContribution,
  } = calcMandatoryPensionContribution(gross)

  const initalGross = gross
  const realGross = initalGross - thirdPillarContribution

  const income = calcIncomeAfterDeductions(realGross, pensionContribution)

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

  const { healthInsuranceContribution, total: totalCost } =
    grossToTotal(realGross)

  // Calculations

  const netShareOfTotal = ensureFloat(net / totalCost)
  const netShareOfGross = ensureFloat(net / realGross) // gross after third pillar deduction from which everything is calculated
  const netShareOfInitialGross = ensureFloat(net / initalGross)

  const wouldBeNetFromInitialGross =
    realGross !== initalGross
      ? grossToNet(initalGross, {
          place,
          taxRateHigh,
          taxRateLow,
          personalAllowanceCoefficient,
        })
      : undefined

  const wouldBeNetShareOfInitialGross = wouldBeNetFromInitialGross
    ? ensureFloat(wouldBeNetFromInitialGross / initalGross)
    : undefined

  const netDifference = wouldBeNetFromInitialGross
    ? ensureFloat(net - wouldBeNetFromInitialGross)
    : undefined

  return {
    net,
    gross: realGross,
    initalGross,
    totalCost,
    pension: {
      firstPilar,
      secondPillar,
      thirdPillar: thirdPillarContribution,
      mandatoryTotal: pensionContribution,
      total: pensionContribution + thirdPillarContribution,
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
      place: place ?? undefined,
      taxRateLow,
      taxRateHigh,
      personalAllowanceCoefficient,
      basicPersonalAllowance: BASIC_PERSONAL_ALLOWANCE,
    },
    calculations: {
      netShareOfTotal,
      netShareOfGross,
      netShareOfInitialGross,
      wouldBeNetFromInitialGross,
      wouldBeNetShareOfInitialGross,
      netDifference,
    },
  }
}
