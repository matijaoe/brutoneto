import type { Place } from '../data/places'
import type { SalaryConfig } from './gross-to-net'
import type {
  NonTaxableBenefitsBreakdown,
  NonTaxableBenefitsConfig,
} from './non-taxable-benefits'
import {
  CORPORATE_TAX_RATE,
  DIRECTOR_MINIMUM_GROSS,
  DIVIDEND_TAX_RATE,
} from '../constants'
import { Decimal } from '../lib/decimal'
import { assertFinitePositive, assertValidSalary, roundEuros } from '../utils/precision'
import { grossToNetBreakdown } from './gross-to-net'
import { calculateNonTaxableBenefits } from './non-taxable-benefits'

export interface DooConfig {
  /**
   * Director's gross salary (bruto 1).
   * Defaults to DIRECTOR_MINIMUM_GROSS (direktorski minimalac, €1,295.45).
   */
  directorGross?: number
  place?: Place
  taxRateLow?: number
  taxRateHigh?: number
  personalAllowanceCoefficient?: number
  thirdPillarContribution?: number
  /**
   * Percentage of profit after corporate tax to withdraw as dividend (0–100).
   * The remainder stays in the company as retained earnings.
   * Defaults to 100 (withdraw everything).
   */
  dividendPercentage?: number
  /**
   * Percentage of income tax returned via annual tax return (0–100).
   * Defaults to 50 (half the tax is returned).
   */
  taxReturnPercentage?: number
  /**
   * Optional non-taxable benefits paid by the company on top of salary.
   * These reduce corporate profit (and therefore corporate tax and dividend),
   * but go directly to the employee (or to a third party for asset items).
   */
  benefits?: NonTaxableBenefitsConfig
}

export interface DooBreakdown {
  totalRevenue: number
  directorGross: number

  salary: {
    gross: number
    totalCostToEmployer: number
    healthInsurance: number
    pension: {
      firstPillar: number
      secondPillar: number
      mandatoryTotal: number
      thirdPillar: number
      total: number
    }
    income: number
    personalAllowance: number
    taxableIncome: number
    taxes: {
      lowerBracket: number
      higherBracket: number
      total: number
      totalHalf: number
    }
    net: number
  }

  corporate: {
    profit: number
    corporateTaxRate: number
    corporateTax: number
    profitAfterTax: number
    retainedEarnings: number
  }

  dividend: {
    grossDividend: number
    dividendTaxRate: number
    dividendTax: number
    netDividend: number
  }

  benefits: NonTaxableBenefitsBreakdown

  totals: {
    netSalary: number
    netDividend: number
    monthlyNet: number
    taxReturn: number
    monthlyNetWithTaxReturn: number
    /** Sum of enabled cash-flow benefits (€/mo). */
    cashBenefits: number
    /** Sum of enabled asset-flow benefits (€/mo) — insurance + pension. */
    assetBenefits: number
    /** Net salary + net dividend + cash benefits. What lands in the bank. */
    cashInHand: number
    /** Company balance (retained earnings) + asset benefits. Locked / not spendable now. */
    assets: number
    /** Cash in hand + assets. Total monthly value produced. */
    totalValue: number
    /**
     * Estimated tax saving vs taking the same amount through dividend.
     * Formula: total benefits × (1 − (1 − corp) × (1 − div)).
     * With 10% corp + 12% div this is ~20.8%.
     */
    savingsVsDividend: number
  }

  variables: {
    place: Place | undefined
    taxRateLow: number
    taxRateHigh: number
    personalAllowanceCoefficient: number
    corporateTaxRate: number
    dividendTaxRate: number
    dividendPercentage: number
    taxReturnPercentage: number
    directorMinimumGross: number
    isDirectorMinimum: boolean
  }
}

/**
 * Calculates the full d.o.o. (Croatian LLC) salary + dividend breakdown.
 *
 * Given total monthly revenue and a director's gross salary, computes:
 * - Net salary (via grossToNetBreakdown)
 * - Corporate profit and tax (10%)
 * - Dividend distribution and tax (12%)
 * - Total take-home (net salary + net dividend)
 *
 * @note Kalkulator d.o.o. - plaća direktora + dividenda
 *
 * @param totalRevenue - Monthly gross revenue to the company (EUR).
 * @param config - Optional configuration.
 * @returns Full DOO breakdown.
 */
export function calculateDoo(totalRevenue: number, config: DooConfig = {}): DooBreakdown {
  assertFinitePositive(totalRevenue, 'totalRevenue')

  const directorGross = config.directorGross ?? DIRECTOR_MINIMUM_GROSS
  assertValidSalary(directorGross, 'directorGross')

  const dividendPercentage = config.dividendPercentage ?? 100
  if (dividendPercentage < 0 || dividendPercentage > 100) {
    throw new Error('dividendPercentage must be between 0 and 100')
  }

  const taxReturnPercentage = config.taxReturnPercentage ?? 50
  if (taxReturnPercentage < 0 || taxReturnPercentage > 100) {
    throw new Error('taxReturnPercentage must be between 0 and 100')
  }

  const isDirectorMinimum = config.directorGross == null
    || config.directorGross === DIRECTOR_MINIMUM_GROSS

  // Salary config for grossToNetBreakdown
  const salaryConfig: SalaryConfig = {
    place: config.place,
    taxRateLow: config.taxRateLow,
    taxRateHigh: config.taxRateHigh,
    personalAllowanceCoefficient: config.personalAllowanceCoefficient,
    thirdPillarContribution: config.thirdPillarContribution,
  }

  // Step 1: Calculate salary breakdown using existing function
  const salaryBreakdown = grossToNetBreakdown(directorGross, salaryConfig)
  const netSalary = salaryBreakdown.net
  const bruto2 = salaryBreakdown.totalCostToEmployer

  // Step 2: Non-taxable benefits (reduce profit dollar-for-dollar)
  const benefits = calculateNonTaxableBenefits(config.benefits)

  // Step 3: Corporate profit = revenue − salary cost − benefits expense (clamped to 0)
  const $revenue = new Decimal(totalRevenue)
  const $bruto2 = new Decimal(bruto2)
  const $benefitsExpense = new Decimal(benefits.totalMonthly)
  const $rawProfit = $revenue.sub($bruto2).sub($benefitsExpense)
  const $profit = $rawProfit.greaterThan(0) ? $rawProfit : new Decimal(0)

  const $corporateTax = $profit.mul(CORPORATE_TAX_RATE).toDP(2)
  const $profitAfterTax = $profit.sub($corporateTax).toDP(2)

  // Step 4: Dividend (only the withdrawn percentage)
  const $dividendPct = new Decimal(dividendPercentage).div(100)
  const $grossDividend = $profitAfterTax.mul($dividendPct).toDP(2)
  const $retainedEarnings = $profitAfterTax.sub($grossDividend).toDP(2)
  const $dividendTax = $grossDividend.mul(DIVIDEND_TAX_RATE).toDP(2)
  const $netDividend = $grossDividend.sub($dividendTax).toDP(2)

  // Step 5: Totals (retained earnings NOT included in take-home)
  const $netSalary = new Decimal(netSalary)
  const $monthlyNet = $netSalary.add($netDividend).toDP(2)
  const $taxReturnPct = new Decimal(taxReturnPercentage).div(100)
  const $taxReturn = new Decimal(salaryBreakdown.taxes.total).mul($taxReturnPct).toDP(2)
  const taxReturn = roundEuros($taxReturn.toNumber())
  const $monthlyNetWithTaxReturn = $monthlyNet.add($taxReturn).toDP(2)

  // Step 6: Benefits-aware aggregates
  const $cashBenefits = new Decimal(benefits.cashMonthly)
  const $assetBenefits = new Decimal(benefits.assetMonthly)
  const $cashInHand = $netSalary.add($netDividend).add($cashBenefits).toDP(2)
  const $assets = $retainedEarnings.add($assetBenefits).toDP(2)
  const $totalValue = $cashInHand.add($assets).toDP(2)

  // Savings vs the dividend route: 1 − (1 − corp)(1 − div).
  // For default 10% / 12% rates this works out to ~20.8%.
  const dividendRouteFactor = new Decimal(1)
    .sub(new Decimal(1).sub(CORPORATE_TAX_RATE).mul(new Decimal(1).sub(DIVIDEND_TAX_RATE)))
  const $savingsVsDividend = new Decimal(benefits.totalMonthly).mul(dividendRouteFactor).toDP(2)

  return {
    totalRevenue: roundEuros(totalRevenue),
    directorGross: roundEuros(directorGross),

    salary: {
      gross: salaryBreakdown.gross,
      totalCostToEmployer: salaryBreakdown.totalCostToEmployer,
      healthInsurance: salaryBreakdown.healthInsurance,
      pension: salaryBreakdown.pension,
      income: salaryBreakdown.income,
      personalAllowance: salaryBreakdown.personalAllowance,
      taxableIncome: salaryBreakdown.taxableIncome,
      taxes: salaryBreakdown.taxes,
      net: salaryBreakdown.net,
    },

    corporate: {
      profit: roundEuros($profit.toNumber()),
      corporateTaxRate: CORPORATE_TAX_RATE,
      corporateTax: roundEuros($corporateTax.toNumber()),
      profitAfterTax: roundEuros($profitAfterTax.toNumber()),
      retainedEarnings: roundEuros($retainedEarnings.toNumber()),
    },

    dividend: {
      grossDividend: roundEuros($grossDividend.toNumber()),
      dividendTaxRate: DIVIDEND_TAX_RATE,
      dividendTax: roundEuros($dividendTax.toNumber()),
      netDividend: roundEuros($netDividend.toNumber()),
    },

    benefits,

    totals: {
      netSalary,
      netDividend: roundEuros($netDividend.toNumber()),
      monthlyNet: roundEuros($monthlyNet.toNumber()),
      taxReturn,
      monthlyNetWithTaxReturn: roundEuros($monthlyNetWithTaxReturn.toNumber()),
      cashBenefits: benefits.cashMonthly,
      assetBenefits: benefits.assetMonthly,
      cashInHand: roundEuros($cashInHand.toNumber()),
      assets: roundEuros($assets.toNumber()),
      totalValue: roundEuros($totalValue.toNumber()),
      savingsVsDividend: roundEuros($savingsVsDividend.toNumber()),
    },

    variables: {
      place: config.place ?? undefined,
      taxRateLow: salaryBreakdown.variables.taxRateLow,
      taxRateHigh: salaryBreakdown.variables.taxRateHigh,
      personalAllowanceCoefficient: salaryBreakdown.variables.personalAllowanceCoefficient,
      corporateTaxRate: CORPORATE_TAX_RATE,
      dividendTaxRate: DIVIDEND_TAX_RATE,
      dividendPercentage,
      taxReturnPercentage,
      directorMinimumGross: DIRECTOR_MINIMUM_GROSS,
      isDirectorMinimum,
    },
  }
}

/**
 * Simplified d.o.o. calculation returning just net salary, net dividend, and total.
 *
 * @param totalRevenue - Monthly gross revenue to the company (EUR).
 * @param config - Optional configuration.
 * @returns Net salary, net dividend, and total monthly take-home.
 */
export function calculateDooSimple(totalRevenue: number, config: DooConfig = {}): {
  netSalary: number
  netDividend: number
  total: number
} {
  const result = calculateDoo(totalRevenue, config)
  return {
    netSalary: result.totals.netSalary,
    netDividend: result.totals.netDividend,
    total: result.totals.monthlyNet,
  }
}
