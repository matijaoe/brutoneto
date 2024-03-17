import Decimal from 'decimal.js'
import {
  BASIC_PERSONAL_ALLOWANCE,
  PERSONAL_ALLOWANCE_COEFFICIENT,
  RATE,
  THIRD_PILLAR_NON_TAXABLE_LIMIT,
} from '../constants'
import { Place, PlaceMap } from '../generated/places'
import { isBetween, toDecimal } from '../utils'
import {
  calcFinalNet,
  calcIncomeAfterDeductions,
  calcMandatoryPensionContribution,
  calcPersonalAllowance,
  calcTax,
  calcTaxableIncome,
  grossToTotal,
} from './salary'

export type GrossToNetConfig = {
  place?: Place
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
  thirdPillarContribution?: number
}

const handleThirdPillar = (
  thirdPillarContribution: number,
  opts?: { strict?: boolean },
) => {
  const { strict = true } = opts ?? {}
  const inRange = isBetween(thirdPillarContribution, {
    min: 0,
    max: THIRD_PILLAR_NON_TAXABLE_LIMIT,
  })

  if (!inRange && strict) {
    throw new Error(
      `Third pillar contribution can't be negative and must be up to ${THIRD_PILLAR_NON_TAXABLE_LIMIT}. Got: ${thirdPillarContribution}.`,
    )
  }

  return inRange
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

  handleThirdPillar(thirdPillarContribution)

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceMap[place] : config

  const realGross = Decimal.sub(gross, thirdPillarContribution).toNumber()

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

  handleThirdPillar(thirdPillarContribution)

  const {
    taxRateLow = RATE.TAX_LOW_BRACKET,
    taxRateHigh = RATE.TAX_HIGH_BRACKET,
  } = place ? PlaceMap[place] : config

  const {
    firstPilar,
    secondPillar,
    total: pensionContribution,
  } = calcMandatoryPensionContribution(gross)

  const originalGross = gross
  const realGross = Decimal.sub(gross, thirdPillarContribution).toNumber()
  const matchingGross = originalGross === realGross

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

  const { healthInsuranceContribution, total: totalCostToEmployer } =
    grossToTotal(realGross)

  // Calculations

  const $net = toDecimal(net)

  const netShareOfTotal = $net.div(totalCostToEmployer).toDP(2).toNumber()
  const netShareOfGross = $net.div(realGross).toDP(2).toNumber()
  const netShareOfInitialGross = !matchingGross
    ? $net.div(originalGross).toDP(2).toNumber()
    : undefined

  const wouldBeNetFromInitialGross = !matchingGross
    ? grossToNet(originalGross, {
      place,
      taxRateHigh,
      taxRateLow,
      personalAllowanceCoefficient,
    })
    : undefined

  const wouldBeNetShareOfInitialGross = wouldBeNetFromInitialGross
    ? Decimal.div(wouldBeNetFromInitialGross, originalGross).toDP(2).toNumber()
    : undefined

  const netDifference = wouldBeNetFromInitialGross
    ? Decimal.sub(net, wouldBeNetFromInitialGross).abs().toDP(2).toNumber()
    : undefined

  return {
    net,
    gross: realGross,
    originalGross: !matchingGross ? originalGross : undefined,
    totalCostToEmployer,
    pension: {
      firstPilar,
      secondPillar,
      thirdPillar: thirdPillarContribution,
      mandatoryTotal: pensionContribution,
      total: pensionContribution + thirdPillarContribution,
    },
    taxes: {
      lowerBracket: taxLower,
      higherBracket: taxHigher,
      total: taxes,
    },
    healthInsurance: healthInsuranceContribution,
    income,
    personalAllowance,
    taxableIncome,
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
