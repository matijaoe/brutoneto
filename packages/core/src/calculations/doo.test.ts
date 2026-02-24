import { describe, expect, it } from 'vitest'
import { CORPORATE_TAX_RATE, DIRECTOR_MINIMUM_GROSS, DIVIDEND_TAX_RATE } from '../constants'
import { roundEuros } from '../utils/precision'
import { calculateDoo, calculateDooSimple } from './doo'
import { grossToNet, grossToNetBreakdown } from './gross-to-net'
import { grossToTotal } from './salary'

describe('calculateDoo', () => {
  it('should use director minimum gross by default', () => {
    const result = calculateDoo(5000)
    expect(result.directorGross).toBe(DIRECTOR_MINIMUM_GROSS)
    expect(result.variables.isDirectorMinimum).toBe(true)
  })

  it('should calculate correct salary net using existing grossToNet', () => {
    const result = calculateDoo(5000)
    const expectedNet = grossToNet(DIRECTOR_MINIMUM_GROSS)
    expect(result.salary.net).toBe(expectedNet)
    expect(result.totals.netSalary).toBe(expectedNet)
  })

  it('should calculate correct bruto2 from grossToTotal', () => {
    const result = calculateDoo(5000)
    const { total: expectedBruto2 } = grossToTotal(DIRECTOR_MINIMUM_GROSS)
    expect(result.salary.totalCostToEmployer).toBe(expectedBruto2)
  })

  it('should match grossToNetBreakdown salary results exactly', () => {
    const directorGross = 2000
    const result = calculateDoo(8000, { directorGross })
    const directBreakdown = grossToNetBreakdown(directorGross)

    expect(result.salary.net).toBe(directBreakdown.net)
    expect(result.salary.gross).toBe(directBreakdown.gross)
    expect(result.salary.totalCostToEmployer).toBe(directBreakdown.totalCostToEmployer)
    expect(result.salary.pension).toEqual(directBreakdown.pension)
    expect(result.salary.taxes).toEqual(directBreakdown.taxes)
    expect(result.salary.healthInsurance).toBe(directBreakdown.healthInsurance)
  })

  it('should apply 10% corporate tax rate', () => {
    const result = calculateDoo(5000)
    expect(result.corporate.corporateTaxRate).toBe(CORPORATE_TAX_RATE)

    const expectedTax = roundEuros(result.corporate.profit * CORPORATE_TAX_RATE)
    expect(result.corporate.corporateTax).toBe(expectedTax)
    expect(result.corporate.profitAfterTax).toBe(
      roundEuros(result.corporate.profit - result.corporate.corporateTax),
    )
  })

  it('should apply 12% dividend tax rate', () => {
    const result = calculateDoo(5000)
    expect(result.dividend.dividendTaxRate).toBe(DIVIDEND_TAX_RATE)

    const expectedDividendTax = roundEuros(result.corporate.profitAfterTax * DIVIDEND_TAX_RATE)
    expect(result.dividend.dividendTax).toBe(expectedDividendTax)
    expect(result.dividend.netDividend).toBe(
      roundEuros(result.corporate.profitAfterTax - result.dividend.dividendTax),
    )
  })

  it('should calculate correct totals', () => {
    const result = calculateDoo(5000)
    expect(result.totals.monthlyNet).toBe(
      roundEuros(result.totals.netSalary + result.totals.netDividend),
    )
    expect(result.totals.taxReturn).toBe(result.salary.taxes.totalHalf)
    expect(result.totals.monthlyNetWithTaxReturn).toBe(
      roundEuros(result.totals.monthlyNet + result.totals.taxReturn),
    )
  })

  it('should use custom director gross when specified', () => {
    const result = calculateDoo(10000, { directorGross: 3000 })
    expect(result.directorGross).toBe(3000)
    expect(result.salary.gross).toBe(3000)
    expect(result.variables.isDirectorMinimum).toBe(false)
  })

  it('should clamp profit to 0 when revenue is less than bruto2', () => {
    const result = calculateDoo(1000)
    expect(result.corporate.profit).toBe(0)
    expect(result.corporate.corporateTax).toBe(0)
    expect(result.corporate.profitAfterTax).toBe(0)
    expect(result.dividend.netDividend).toBe(0)
    expect(result.totals.netDividend).toBe(0)
  })

  it('should support place configuration', () => {
    const result = calculateDoo(5000, { place: 'zagreb' })
    expect(result.variables.place).toBe('zagreb')
  })

  it('should produce different salary net for different places', () => {
    const resultDefault = calculateDoo(5000)
    const resultZagreb = calculateDoo(5000, { place: 'zagreb' })
    // Default rates (20%/30%) differ from Zagreb rates, so nets differ
    expect(resultDefault.salary.net).not.toBe(resultZagreb.salary.net)
  })

  it('should throw for negative totalRevenue', () => {
    expect(() => calculateDoo(-1)).toThrow()
  })

  it('should throw for non-finite totalRevenue', () => {
    expect(() => calculateDoo(Infinity)).toThrow()
    expect(() => calculateDoo(Number.NaN)).toThrow()
  })

  it('should throw for invalid directorGross', () => {
    expect(() => calculateDoo(5000, { directorGross: -1 })).toThrow()
  })
})

describe('calculateDoo - dividendPercentage', () => {
  it('should default to 100% dividend withdrawal', () => {
    const result = calculateDoo(5000)
    expect(result.variables.dividendPercentage).toBe(100)
    expect(result.corporate.retainedEarnings).toBe(0)
    // grossDividend should equal profitAfterTax when 100%
    expect(result.dividend.grossDividend).toBe(result.corporate.profitAfterTax)
  })

  it('should withdraw 50% of profit after tax as dividend', () => {
    const full = calculateDoo(5000)
    const half = calculateDoo(5000, { dividendPercentage: 50 })

    const expectedGrossDividend = roundEuros(full.corporate.profitAfterTax * 0.5)
    expect(half.dividend.grossDividend).toBe(expectedGrossDividend)

    const expectedDividendTax = roundEuros(expectedGrossDividend * DIVIDEND_TAX_RATE)
    expect(half.dividend.dividendTax).toBe(expectedDividendTax)

    const expectedNetDividend = roundEuros(expectedGrossDividend - expectedDividendTax)
    expect(half.dividend.netDividend).toBe(expectedNetDividend)

    // Retained earnings = profitAfterTax - grossDividend
    expect(half.corporate.retainedEarnings).toBe(
      roundEuros(half.corporate.profitAfterTax - half.dividend.grossDividend),
    )
  })

  it('should retain all profit when dividendPercentage is 0', () => {
    const result = calculateDoo(5000, { dividendPercentage: 0 })

    expect(result.dividend.grossDividend).toBe(0)
    expect(result.dividend.dividendTax).toBe(0)
    expect(result.dividend.netDividend).toBe(0)
    expect(result.corporate.retainedEarnings).toBe(result.corporate.profitAfterTax)
    expect(result.totals.monthlyNet).toBe(result.totals.netSalary)
  })

  it('should satisfy retainedEarnings + grossDividend === profitAfterTax', () => {
    for (const pct of [0, 25, 50, 75, 100]) {
      const result = calculateDoo(5000, { dividendPercentage: pct })
      expect(
        roundEuros(result.corporate.retainedEarnings + result.dividend.grossDividend),
      ).toBe(result.corporate.profitAfterTax)
    }
  })

  it('should not affect salary calculation', () => {
    const full = calculateDoo(5000)
    const partial = calculateDoo(5000, { dividendPercentage: 30 })

    expect(partial.salary).toEqual(full.salary)
    expect(partial.corporate.profit).toBe(full.corporate.profit)
    expect(partial.corporate.corporateTax).toBe(full.corporate.corporateTax)
    expect(partial.corporate.profitAfterTax).toBe(full.corporate.profitAfterTax)
  })

  it('should throw for dividendPercentage below 0', () => {
    expect(() => calculateDoo(5000, { dividendPercentage: -1 })).toThrow()
  })

  it('should throw for dividendPercentage above 100', () => {
    expect(() => calculateDoo(5000, { dividendPercentage: 101 })).toThrow()
  })
})

describe('calculateDooSimple', () => {
  it('should return netSalary, netDividend, and total', () => {
    const simple = calculateDooSimple(5000)
    const full = calculateDoo(5000)

    expect(simple.netSalary).toBe(full.totals.netSalary)
    expect(simple.netDividend).toBe(full.totals.netDividend)
    expect(simple.total).toBe(full.totals.monthlyNet)
  })

  it('should respect config options', () => {
    const simple = calculateDooSimple(10000, { directorGross: 2000, place: 'zagreb' })
    const full = calculateDoo(10000, { directorGross: 2000, place: 'zagreb' })

    expect(simple.netSalary).toBe(full.totals.netSalary)
    expect(simple.netDividend).toBe(full.totals.netDividend)
    expect(simple.total).toBe(full.totals.monthlyNet)
  })
})
