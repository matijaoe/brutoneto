import type { DooBreakdown } from '@brutoneto/core'
import type { AdjustedDividend, BreakdownRow, BreakdownSection, SalaryData, SalaryMode } from '~/types'
import { formatEur } from '~/utils/formatters'

function buildSalaryRows(d: SalaryData | DooBreakdown['salary'], taxReturnAmount: number, taxRates: { low: number, high: number }): BreakdownRow[] {
  const rows: BreakdownRow[] = [
    { label: 'Gross salary (Bruto 1)', value: formatEur(d.gross), type: 'primary' },
    { label: 'Total cost to employer (Bruto 2)', value: formatEur(d.totalCostToEmployer), type: 'primary' },

    { label: 'DEDUCTIONS', value: '', type: 'sub-heading' },
    { label: 'Health insurance', value: formatEur(d.healthInsurance), type: 'supporting' },
    { label: 'Pension \u2014 1st pillar', value: formatEur(d.pension.firstPillar), type: 'supporting' },
    { label: 'Pension \u2014 2nd pillar', value: formatEur(d.pension.secondPillar), type: 'supporting' },
  ]

  if (d.pension.thirdPillar > 0) {
    rows.push(
      { label: 'Pension \u2014 3rd pillar (voluntary)', value: formatEur(d.pension.thirdPillar), type: 'supporting' },
    )
  }

  const lowPct = Math.round(taxRates.low * 100)
  const highPct = Math.round(taxRates.high * 100)

  rows.push(
    { label: 'Income (after deductions)', value: formatEur(d.income), type: 'primary' },
    { label: 'Personal allowance', value: formatEur(d.personalAllowance), type: 'supporting' },
    { label: 'Taxable income', value: formatEur(d.taxableIncome), type: 'primary' },

    { label: 'INCOME TAX', value: '', type: 'sub-heading' },
    { label: `Lower bracket (${lowPct}%)`, value: formatEur(d.taxes.lowerBracket), type: 'supporting' },
    { label: `Higher bracket (${highPct}%)`, value: formatEur(d.taxes.higherBracket), type: 'supporting' },
    { label: 'Total tax', value: formatEur(d.taxes.total), type: 'primary' },
  )

  if (taxReturnAmount > 0) {
    rows.push(
      { label: `Tax return (${d.taxes.total > 0 ? Math.round(taxReturnAmount / d.taxes.total * 100) : 0}% of tax)`, value: formatEur(taxReturnAmount), type: 'supporting', color: 'green' },
    )
  }

  rows.push(
    { label: 'Net salary', value: formatEur(d.net), type: 'summary', color: 'neutral' },
  )

  return rows
}

export function useSalaryBreakdownSections(
  data: Ref<SalaryData | null>,
  mode: Ref<SalaryMode>,
  taxReturnAmount: Ref<number>,
): ComputedRef<BreakdownSection[]> {
  return computed(() => {
    if (!data.value) return []
    const d = data.value

    const salaryRows = buildSalaryRows(d, taxReturnAmount.value, {
      low: d.variables.taxRateLow,
      high: d.variables.taxRateHigh,
    })

    const badge = mode.value === 'gross-to-net'
      ? `${formatEur(d.gross)} gross \u2192 ${formatEur(d.net)} net`
      : `${formatEur(d.net)} net \u2192 ${formatEur(d.gross)} gross`

    return [
      {
        title: 'Salary Breakdown',
        badge,
        rows: salaryRows,
      },
    ]
  })
}

export function useDooBreakdownSections(
  data: Ref<DooBreakdown | null>,
  adjustedDividend: ComputedRef<AdjustedDividend | null>,
): ComputedRef<BreakdownSection[]> {
  return computed(() => {
    if (!data.value) return []
    const d = data.value
    const adj = adjustedDividend.value

    // Section 1: Salary Breakdown
    const salaryRows = buildSalaryRows(d.salary, adj?.taxReturn ?? 0, {
      low: d.variables.taxRateLow,
      high: d.variables.taxRateHigh,
    })

    // Section 2: Corporate & Dividend
    const dividendPct = adj ? Math.round((adj.grossDividend / d.corporate.profitAfterTax) * 100) : 100
    const corpRows: BreakdownRow[] = [
      { label: 'CORPORATE', value: '', type: 'sub-heading' },
      { label: 'Revenue \u2013 salary costs', value: formatEur(d.corporate.profit), type: 'primary' },
      { label: `Corporate tax (${Math.round(d.corporate.corporateTaxRate * 100)}%)`, value: formatEur(d.corporate.corporateTax), type: 'supporting' },
      { label: 'Profit after tax', value: formatEur(d.corporate.profitAfterTax), type: 'primary' },

      { label: `DIVIDEND (${dividendPct}% WITHDRAWAL)`, value: '', type: 'sub-heading' },
      { label: 'Gross dividend', value: formatEur(adj?.grossDividend ?? d.dividend.grossDividend), type: 'primary' },
      { label: `Dividend tax (${Math.round(d.dividend.dividendTaxRate * 100)}%)`, value: formatEur(adj?.dividendTax ?? d.dividend.dividendTax), type: 'supporting' },
      { label: 'Net dividend', value: formatEur(adj?.netDividend ?? d.dividend.netDividend), type: 'summary', color: 'purple' },
    ]

    if ((adj?.retained ?? d.corporate.retainedEarnings) > 0) {
      corpRows.push(
        { label: 'Company balance', value: formatEur(adj?.retained ?? d.corporate.retainedEarnings), type: 'summary', color: 'green' },
      )
    }

    // Section 3: All Taxes & Costs
    const totalSalaryTax = d.salary.taxes.total
    const totalPension = d.salary.pension.mandatoryTotal
    const healthIns = d.salary.healthInsurance
    const corpTax = d.corporate.corporateTax
    const divTax = adj?.dividendTax ?? d.dividend.dividendTax
    const allTaxes = totalSalaryTax + totalPension + healthIns + corpTax + divTax
    const effectiveRate = d.totalRevenue > 0 ? ((allTaxes / d.totalRevenue) * 100).toFixed(1) : '0'

    const taxRows: BreakdownRow[] = [
      { label: 'Income tax', value: formatEur(totalSalaryTax), type: 'primary' },
      { label: 'Pension contributions', value: formatEur(totalPension), type: 'primary' },
      { label: 'Health insurance', value: formatEur(healthIns), type: 'primary' },
      { label: 'Corporate tax', value: formatEur(corpTax), type: 'primary' },
      { label: 'Dividend tax', value: formatEur(divTax), type: 'primary' },
      { label: 'Total taxes & contributions', value: formatEur(allTaxes), type: 'summary', color: 'red' },
    ]

    const salaryBadge = `${formatEur(d.salary.gross)} gross \u2192 ${formatEur(d.salary.net)} net`
    const corpBadge = `${formatEur(d.corporate.profitAfterTax)} profit \u2192 ${formatEur(adj?.netDividend ?? d.dividend.netDividend)} net`
    const taxBadge = `effective rate ${effectiveRate}%`

    return [
      { title: 'Salary Breakdown', badge: salaryBadge, rows: salaryRows },
      { title: 'Corporate & Dividend', badge: corpBadge, rows: corpRows },
      { title: 'All Taxes & Costs', badge: taxBadge, rows: taxRows },
    ]
  })
}
