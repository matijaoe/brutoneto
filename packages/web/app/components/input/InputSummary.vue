<script setup lang="ts">
import type { DooBreakdown } from '@brutoneto/core'
import type { AdjustedDividend, Mode, Period } from '~/types'
import { formatEur } from '~/utils/formatters'

const props = defineProps<{
  mode: Mode
  salaryData?: { net: number, gross: number, totalCostToEmployer?: number, taxes?: { total: number } } | null
  dooData?: DooBreakdown | null
  adjustedDividend?: AdjustedDividend | null
  period: Period
}>()

const items = computed(() => {
  if (props.mode === 'doo' && props.dooData && props.adjustedDividend) {
    const adj = props.adjustedDividend
    const revenue = props.dooData.totalRevenue
    const allTaxes = props.dooData.salary.taxes.total
      + props.dooData.salary.pension.mandatoryTotal
      + props.dooData.salary.healthInsurance
      + props.dooData.corporate.corporateTax
      + (adj.netDividend > 0 ? adj.dividendTax : 0)
    const effectiveRate = revenue > 0 ? ((allTaxes / revenue) * 100).toFixed(1) : '0'

    const result: Array<{ label: string, value: string, color?: string }> = [
      { label: 'Take-home', value: `${formatEur(adj.monthlyNet)}/mo` },
      { label: 'Effective tax', value: `${effectiveRate}%` },
    ]
    if (adj.retained > 0) {
      result.push({ label: 'Balance', value: `${formatEur(adj.retained)}/mo`, color: 'green' })
    }
    return result
  }

  if (props.mode !== 'doo' && props.salaryData) {
    const d = props.salaryData
    const suffix = props.period === 'yearly' ? '/yr' : '/mo'
    const result: Array<{ label: string, value: string, color?: string }> = [
      { label: 'Net', value: `${formatEur(d.net)}${suffix}` },
    ]
    if (d.taxes?.total) {
      result.push({ label: 'Tax', value: `${formatEur(d.taxes.total)}${suffix}` })
    }
    if (d.totalCostToEmployer) {
      result.push({ label: 'Bruto 2', value: `${formatEur(d.totalCostToEmployer)}${suffix}` })
    }
    return result
  }

  return []
})
</script>

<template>
  <div v-if="items.length > 0" class="border border-default rounded-lg px-4 py-3">
    <p class="text-xs uppercase text-muted tracking-wider font-medium mb-2">
      Summary
    </p>
    <div class="flex flex-col gap-1.5">
      <div
        v-for="item in items"
        :key="item.label"
        class="flex items-center justify-between"
      >
        <span class="text-sm text-dimmed">{{ item.label }}</span>
        <span
          class="font-unifontex font-bold tabular-nums"
          :class="item.color === 'green' ? 'text-green-400' : 'text-foreground'"
        >
          {{ item.value }}
        </span>
      </div>
    </div>
  </div>
</template>
