import type { DooBreakdown, NonTaxableBenefitsBreakdown } from '@brutoneto/core'
import type { AdjustedDividend, BreakdownRow, BreakdownSection, SalaryData, SalaryMode } from '~/types'
import { formatEur, toYearly } from '~/utils/formatters'

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
        title: 'Salary breakdown',
        badge,
        rows: salaryRows,
      },
    ]
  })
}

export function useDooBreakdownSections(
  data: Ref<DooBreakdown | null>,
  adjustedDividend: ComputedRef<AdjustedDividend | null>,
  benefits: Ref<NonTaxableBenefitsBreakdown>,
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

    // Section 2: Corporate & Dividend (use benefits-adjusted values from `adj` when available)
    const profitAfterTax = adj?.profitAfterTax ?? d.corporate.profitAfterTax
    const dividendPct = adj && profitAfterTax > 0
      ? Math.round((adj.grossDividend / profitAfterTax) * 100)
      : 100
    const profit = adj?.profit ?? d.corporate.profit
    const corporateTax = adj?.corporateTax ?? d.corporate.corporateTax

    const profitLabel = (adj && (adj.cashBenefits + adj.assetBenefits) > 0)
      ? 'Revenue \u2013 salary costs \u2013 benefits'
      : 'Revenue \u2013 salary costs'

    const corpRows: BreakdownRow[] = [
      { label: 'CORPORATE', value: '', type: 'sub-heading' },
      { label: profitLabel, value: formatEur(profit), type: 'primary' },
      { label: `Corporate tax (${Math.round(d.corporate.corporateTaxRate * 100)}%)`, value: formatEur(corporateTax), type: 'supporting' },
      { label: 'Profit after tax', value: formatEur(profitAfterTax), type: 'primary' },

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

    // Section: Non-taxable benefits (only when something is enabled)
    const b = benefits.value
    let benefitsSection: BreakdownSection | null = null
    if (b.items.length > 0) {
      const rows: BreakdownRow[] = []

      const cashItems = b.items.filter(i => i.flow === 'cash')
      const assetItems = b.items.filter(i => i.flow === 'asset')

      if (cashItems.length > 0) {
        rows.push({ label: 'CASH (žiro)', value: '', type: 'sub-heading' })
        for (const item of cashItems) {
          rows.push({
            label: item.label,
            value: `${formatEur(item.monthly)} / ${formatEur(item.yearly)} /yr`,
            type: 'supporting',
          })
        }
        rows.push({
          label: 'Cash subtotal',
          value: `${formatEur(b.cashMonthly)} / ${formatEur(b.cashYearly)} /yr`,
          type: 'primary',
        })
      }

      if (assetItems.length > 0) {
        rows.push({ label: 'ASSETS (polica / štednja)', value: '', type: 'sub-heading' })
        for (const item of assetItems) {
          rows.push({
            label: item.label,
            value: `${formatEur(item.monthly)} / ${formatEur(item.yearly)} /yr`,
            type: 'supporting',
          })
        }
        rows.push({
          label: 'Asset subtotal',
          value: `${formatEur(b.assetMonthly)} / ${formatEur(b.assetYearly)} /yr`,
          type: 'primary',
          color: 'purple',
        })
      }

      rows.push({
        label: 'Total company expense',
        value: `${formatEur(b.totalMonthly)} / ${formatEur(b.totalYearly)} /yr`,
        type: 'summary',
      })

      if (adj && adj.savingsVsDividend > 0) {
        rows.push({
          label: 'Saving vs dividend route',
          value: `${formatEur(adj.savingsVsDividend)} / ${formatEur(toYearly(adj.savingsVsDividend))} /yr`,
          type: 'supporting',
          color: 'green',
        })
      }

      benefitsSection = {
        title: 'Neoporezivi primici',
        badge: `${formatEur(b.totalMonthly)} /mo · ${b.items.length} ${b.items.length === 1 ? 'stavka' : 'stavki'}`,
        rows,
      }
    }

    // Section 3: All Taxes & Costs
    const totalSalaryTax = d.salary.taxes.total
    const totalPension = d.salary.pension.mandatoryTotal
    const healthIns = d.salary.healthInsurance
    const corpTax = adj?.corporateTax ?? d.corporate.corporateTax
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
    const corpBadge = `${formatEur(profitAfterTax)} profit \u2192 ${formatEur(adj?.netDividend ?? d.dividend.netDividend)} net`
    const taxBadge = `effective rate ${effectiveRate}%`

    const sections: BreakdownSection[] = [
      { title: 'Salary breakdown', badge: salaryBadge, rows: salaryRows },
      { title: 'Corporate & dividend', badge: corpBadge, rows: corpRows },
    ]
    if (benefitsSection) sections.push(benefitsSection)
    sections.push({ title: 'All taxes & costs', badge: taxBadge, rows: taxRows })
    return sections
  })
}
