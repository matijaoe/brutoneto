<script setup lang="ts">
import type { DooBreakdown, NonTaxableBenefitsBreakdown } from '@brutoneto/core'
import type { AdjustedDividend, ConversionNote } from '~/types'
import { useDooBreakdownSections } from '~/composables/useBreakdownRows'
import { formatEur, toYearly } from '~/utils/formatters'

const props = defineProps<{
  data: DooBreakdown
  adjustedDividend: AdjustedDividend
  conversionNote: ConversionNote | null
  placeName?: string
  benefits: NonTaxableBenefitsBreakdown
}>()

const dataRef = computed(() => props.data)
const adjRef = computed(() => props.adjustedDividend)
const benefitsRef = computed(() => props.benefits)

const sections = useDooBreakdownSections(dataRef, adjRef, benefitsRef)

const hasBenefits = computed(() => props.benefits.items.length > 0)
const hasCashBenefits = computed(() => props.benefits.cashMonthly > 0)
const hasAssetBenefits = computed(() => props.benefits.assetMonthly > 0)

const assetSubtitle = computed(() => {
  if (!hasAssetBenefits.value) return undefined
  const labels = props.benefits.items
    .filter(i => i.flow === 'asset')
    .map(i => i.key === 'treciStup' ? '3. stup' : 'dopunsko')
  return labels.join(' + ')
})

const dividendPct = computed(() => {
  if (!props.adjustedDividend.profitAfterTax) return 100
  return Math.round((props.adjustedDividend.grossDividend / props.adjustedDividend.profitAfterTax) * 100)
})

const retainedPct = computed(() => 100 - dividendPct.value)

const salaryPercentage = computed(() => {
  if (!props.adjustedDividend.monthlyNet) return '0.0'
  return ((props.data.totals.netSalary / props.adjustedDividend.monthlyNet) * 100).toFixed(1)
})

const dividendPercentage = computed(() => {
  if (!props.adjustedDividend.monthlyNet) return '0.0'
  return ((props.adjustedDividend.netDividend / props.adjustedDividend.monthlyNet) * 100).toFixed(1)
})

const distributionSegments = computed(() => {
  const adj = props.adjustedDividend
  const segments: Array<{ label: string, value: number, color: 'neutral' | 'purple' | 'green' | 'red' }> = [
    { label: 'Salary', value: props.data.totals.netSalary, color: 'neutral' },
    { label: 'Dividend', value: adj.netDividend, color: 'purple' },
  ]
  if (adj.retained > 0) {
    segments.push({ label: 'Balance', value: adj.retained, color: 'green' })
  }
  const benefitsTotal = adj.cashBenefits + adj.assetBenefits
  if (benefitsTotal > 0) {
    segments.push({ label: 'Benefits', value: benefitsTotal, color: 'green' })
  }

  const totalTaxes = props.data.salary.taxes.total
    + props.data.salary.pension.mandatoryTotal
    + props.data.salary.healthInsurance
    + adj.corporateTax
    + (adj.netDividend > 0 ? adj.dividendTax : 0)
  segments.push({ label: 'Taxes', value: totalTaxes, color: 'red' })

  return segments
})

const heroSecondaryLine = computed(() => {
  // Prefer the total-value framing whenever there's anything locked (retained
  // earnings or asset benefits), so users see cash now AND wealth accumulation.
  if (props.adjustedDividend.assets > 0) {
    return {
      label: 'Total value',
      value: `${formatEur(props.adjustedDividend.totalValue)} /mo`,
    }
  }
  return undefined
})

const heroExpandedLines = computed(() => {
  if (props.adjustedDividend.taxReturn <= 0) return []
  const yearlyReturn = toYearly(props.adjustedDividend.taxReturn)
  return [
    {
      label: 'effective monthly',
      value: `${formatEur(props.adjustedDividend.monthlyNetWithTaxReturn)}`,
    },
    {
      label: 'yearly return',
      value: `${formatEur(yearlyReturn)}`,
    },
  ]
})

const contextLabel = computed(() => {
  const parts = ['D.O.O.']
  if (props.placeName) parts.push(props.placeName)
  return parts.join(' \u00B7 ')
})
</script>

<template>
  <div class="flex flex-col">
    <!-- Context header -->
    <div>
      <div class="flex items-center gap-2 mb-1">
        <span class="size-2 rounded-full bg-green-500" />
        <span class="text-xs font-unifontex uppercase tracking-wider text-muted">{{ contextLabel }}</span>
      </div>
      <ResultsConversionNote :note="conversionNote" />
    </div>

    <!-- Hero take-home -->
    <div class="mt-8">
      <ResultsHeroNumber
        :amount="adjustedDividend.cashInHand"
        :label="hasBenefits ? 'cash in hand' : 'take-home'"
        :secondary-line="heroSecondaryLine"
        expand-label="with tax return"
        :expanded-lines="heroExpandedLines"
      />
    </div>

    <!-- Distribution bar -->
    <div class="mt-10">
      <ResultsDistributionBar :segments="distributionSegments" />
    </div>

    <!-- Stream cards + retained: tight money group -->
    <div class="mt-6 flex flex-col gap-2">
      <div class="grid sm:grid-cols-2 gap-3">
        <ResultsStreamCard
          label="Net salary"
          :amount="data.totals.netSalary"
          :badge="`${salaryPercentage}%`"
          color="neutral"
        />
        <ResultsStreamCard
          label="Net dividend"
          :amount="adjustedDividend.netDividend"
          :badge="`${dividendPercentage}%`"
          color="purple"
        />
      </div>

      <!-- Non-taxable benefits cards -->
      <div v-if="hasBenefits" class="grid sm:grid-cols-2 gap-3 mt-1">
        <ResultsStreamCard
          v-if="hasCashBenefits"
          label="Neoporezivi primici (keš)"
          :amount="benefits.cashMonthly"
          color="green"
        />
        <!-- Asset benefits get a distinct dashed treatment so users read it as "locked savings" -->
        <div
          v-if="hasAssetBenefits"
          class="rounded-lg border border-dashed border-default bg-default p-4 border-l-3 border-l-amber-500"
        >
          <p class="text-xs font-unifontex uppercase tracking-wider text-amber-400">
            Štednja / osiguranje
          </p>
          <p class="text-3xl font-unifontex mt-1 text-foreground tabular-nums">
            {{ formatEur(benefits.assetMonthly) }}<span class="text-sm text-muted">/mo</span>
          </p>
          <p class="text-sm text-muted font-unifontex mt-0.5 tabular-nums">
            {{ formatEur(toYearly(benefits.assetMonthly)) }} /yr
          </p>
          <p v-if="assetSubtitle" class="text-xs text-dimmed mt-1.5">
            {{ assetSubtitle }} · nije keš
          </p>
        </div>
      </div>

      <!-- Savings vs dividend annotation -->
      <p
        v-if="hasBenefits && adjustedDividend.savingsVsDividend > 0"
        class="text-xs text-dimmed mt-1"
      >
        +{{ formatEur(adjustedDividend.savingsVsDividend) }}/mj ·
        +{{ formatEur(toYearly(adjustedDividend.savingsVsDividend)) }}/god ušteda kroz neoporezivi put vs dividenda
      </p>

      <!-- Retained in company -->
      <div
        v-if="adjustedDividend.retained > 0"
        class="rounded-lg border border-default bg-default p-4 border-l-3 border-l-green-500"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-unifontex uppercase tracking-wider text-green-400">
              Company balance
            </p>
            <p class="text-xs text-dimmed mt-1">
              {{ retainedPct }}% of profit after tax
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-3xl font-unifontex text-foreground tabular-nums">
              {{ formatEur(adjustedDividend.retained) }}<span class="text-sm text-muted">/mo</span>
            </p>
            <p class="text-sm text-muted font-unifontex tabular-nums">
              {{ formatEur(toYearly(adjustedDividend.retained)) }} /yr
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Breakdown accordions -->
    <div class="mt-8">
      <ResultsBreakdownAccordion :sections="sections" />
    </div>
  </div>
</template>
