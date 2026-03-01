<script setup lang="ts">
import type { DooBreakdown } from '@brutoneto/core'
import type { AdjustedDividend, ConversionNote } from '~/types'
import { useDooBreakdownSections } from '~/composables/useBreakdownRows'
import { formatEur, toYearly } from '~/utils/formatters'

const props = defineProps<{
  data: DooBreakdown
  adjustedDividend: AdjustedDividend
  conversionNote: ConversionNote | null
  placeName?: string
}>()

const dataRef = computed(() => props.data)
const adjRef = computed(() => props.adjustedDividend)

const sections = useDooBreakdownSections(dataRef, adjRef)

const dividendPct = computed(() => {
  if (!props.data.corporate.profitAfterTax) return 100
  return Math.round((props.adjustedDividend.grossDividend / props.data.corporate.profitAfterTax) * 100)
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

  const totalTaxes = props.data.salary.taxes.total
    + props.data.salary.pension.mandatoryTotal
    + props.data.salary.healthInsurance
    + props.data.corporate.corporateTax
    + (adj.netDividend > 0 ? adj.dividendTax : 0)
  segments.push({ label: 'Taxes', value: totalTaxes, color: 'red' })

  return segments
})

const heroSecondaryLine = computed(() => {
  if (props.adjustedDividend.retained <= 0) return undefined
  return {
    label: 'Incl. retained',
    value: `${formatEur(props.adjustedDividend.totalWithRetained)} /mo`,
  }
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
        :amount="adjustedDividend.monthlyNet"
        label="take-home"
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
