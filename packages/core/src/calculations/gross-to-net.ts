import {
  BASIC_PERSONAL_ALLOWANCE,
  MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
  MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
  PERSONAL_ALLOWANCE_COEFFICIENT,
  RATE,
  THIRD_PILLAR_NON_TAXABLE_LIMIT,
} from '../constants'
import type { Place } from '../data/places'
import { PlaceMap } from '../data/places'
import { Decimal } from '../lib/decimal'
import { isBetween } from '../utils'
import { assertValidSalary, roundEuros } from '../utils/precision'
import {
  calcFinalNet,
  calcIncomeAfterDeductions,
  calcMandatoryPensionContribution,
  calcPersonalAllowance,
  calcTax,
  calcTaxableIncome,
  grossToTotal,
} from './salary'

export interface SalaryConfig {
  place?: Place
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
  thirdPillarContribution?: number
}

// Utility function specific to gross-to-net calculations
function handleThirdPillar(thirdPillarContribution: number, opts?: { strict?: boolean }) {
  const { strict = true } = opts ?? {}
  const inRange = isBetween(roundEuros(thirdPillarContribution), {
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
 * Calculates the net income based on the gross income.
 * This is a simplified, faster version of calculateSalary that returns only the net amount.
 *
 * @alias brutoToNeto
 *
 * @param gross - The gross income in euros (will be rounded to 2 decimal places).
 * @param config - Optional configuration for tax rates and personal allowance coefficient.
 * @returns The net income in euros (rounded to 2 decimal places).
 * @throws Error if the place specified in the configuration is unknown.
 *
 * @example
 * const net = grossToNet(3000) // returns 2040
 * const net = grossToNet(4000.005) // returns 2668.67 (rounds to 2dp)
 */
export function grossToNet(gross: number, config: SalaryConfig = {}): number {
  assertValidSalary(gross, 'gross')
  const thirdPillarValue = config.thirdPillarContribution ?? 0

  const {
    place,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config

  if (
    personalAllowanceCoefficient < MIN_PERSONAL_ALLOWANCE_COEFFICIENT
    || personalAllowanceCoefficient > MAX_PERSONAL_ALLOWANCE_COEFFICIENT
  ) {
    throw new Error(
      `personalAllowanceCoefficient must be between ${MIN_PERSONAL_ALLOWANCE_COEFFICIENT} and ${MAX_PERSONAL_ALLOWANCE_COEFFICIENT}. Got: ${personalAllowanceCoefficient}.`,
    )
  }

  if (place && !(place in PlaceMap)) {
    throw new Error(`Unknown place "${place}"`)
  }

  handleThirdPillar(thirdPillarValue)

  const placeRates = place ? PlaceMap[place] : undefined
  const taxRateLow = placeRates?.taxRateLow ?? config.taxRateLow ?? RATE.TAX_LOW_BRACKET
  const taxRateHigh = placeRates?.taxRateHigh ?? config.taxRateHigh ?? RATE.TAX_HIGH_BRACKET

  const realGross = new Decimal(gross).sub(thirdPillarValue).toNumber()

  const { total: pensionContribution }
    = calcMandatoryPensionContribution(realGross)

  const income = calcIncomeAfterDeductions(realGross, pensionContribution)

  const personalAllowance = calcPersonalAllowance(
    income,
    personalAllowanceCoefficient,
  )

  const taxableIncome = calcTaxableIncome(income, personalAllowance)

  const { total: taxes } = calcTax(taxableIncome, [taxRateLow, taxRateHigh])

  const net = calcFinalNet(income, taxes)

  return roundEuros(net)
}

/**
 * Calculates comprehensive salary breakdown based on gross salary.
 * Provides detailed breakdown of all salary components (taxes, contributions, etc.).
 *
 * @param gross - The gross salary amount in euros (will be rounded to 2 decimal places).
 * @param config - Optional configuration object.
 * @returns An object containing detailed salary breakdown.
 * @throws Error if the place specified in the configuration is unknown.
 */
export function grossToNetBreakdown(gross: number, config: SalaryConfig = {}) {
  assertValidSalary(gross, 'gross')
  const thirdPillarValue = config.thirdPillarContribution ?? 0

  const {
    place,
    personalAllowanceCoefficient = PERSONAL_ALLOWANCE_COEFFICIENT,
  } = config

  if (
    !isBetween(personalAllowanceCoefficient, [
      MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
      MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
    ])
  ) {
    throw new Error(
      `personalAllowanceCoefficient must be between ${MIN_PERSONAL_ALLOWANCE_COEFFICIENT} and ${MAX_PERSONAL_ALLOWANCE_COEFFICIENT}. Got: ${personalAllowanceCoefficient}.`,
    )
  }

  if (place && !(place in PlaceMap)) {
    throw new Error(`Unknown place "${place}"`)
  }

  handleThirdPillar(thirdPillarValue)

  const placeRates = place ? PlaceMap[place] : undefined
  const taxRateLow = placeRates?.taxRateLow ?? config.taxRateLow ?? (RATE.TAX_LOW_BRACKET)
  const taxRateHigh = placeRates?.taxRateHigh ?? config.taxRateHigh ?? (RATE.TAX_HIGH_BRACKET)

  const {
    firstPillar,
    secondPillar,
    total: pensionContribution,
  } = calcMandatoryPensionContribution(gross)

  const originalGross = gross
  const realGross = new Decimal(gross).sub(thirdPillarValue).toNumber()
  const matchingGross = Math.abs(originalGross - realGross) < 0.01

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

  const { healthInsuranceContribution, total: totalCostToEmployer }
    = grossToTotal(realGross)

  // Calculations

  const $net = new Decimal(net)

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

  const wouldBeNetShareOfInitialGross = wouldBeNetFromInitialGross !== undefined
    ? new Decimal(wouldBeNetFromInitialGross).div(originalGross).toDP(2).toNumber()
    : undefined

  const netDifference = wouldBeNetFromInitialGross !== undefined
    ? new Decimal(net).sub(wouldBeNetFromInitialGross).abs().toDP(2).toNumber()
    : undefined

  return {
    net: roundEuros(net),
    netWithHalfTaxReturned: roundEuros(net + (taxes / 2)),
    gross: roundEuros(realGross),
    originalGross: !matchingGross ? originalGross : undefined,
    totalCostToEmployer: roundEuros(totalCostToEmployer),
    pension: {
      firstPillar: roundEuros(firstPillar),
      secondPillar: roundEuros(secondPillar),
      thirdPillar: roundEuros(thirdPillarValue),
      mandatoryTotal: roundEuros(pensionContribution),
      total: roundEuros(pensionContribution + thirdPillarValue),
    },
    taxes: {
      lowerBracket: roundEuros(taxLower),
      higherBracket: roundEuros(taxHigher),
      total: roundEuros(taxes),
      totalHalf: roundEuros(taxes / 2),
    },
    healthInsurance: roundEuros(healthInsuranceContribution),
    income: roundEuros(income),
    personalAllowance: roundEuros(personalAllowance),
    taxableIncome: roundEuros(taxableIncome),
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
