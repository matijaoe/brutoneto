<script setup lang="ts">
import type { ConversionNote, SalaryData, SalaryMode } from '~/types'
import { useSalaryBreakdownSections } from '~/composables/useBreakdownRows'
import { formatEur, toYearly } from '~/utils/formatters'

const props = defineProps<{
  data: SalaryData
  mode: SalaryMode
  taxReturnAmount: number
  netWithTaxReturn: number
  conversionNote: ConversionNote | null
  placeName?: string
}>()

const dataRef = computed(() => props.data)
const modeRef = computed(() => props.mode)
const taxReturnRef = computed(() => props.taxReturnAmount)

const sections = useSalaryBreakdownSections(dataRef, modeRef, taxReturnRef)

const heroLabel = computed(() =>
  props.mode === 'gross-to-net' ? 'net salary' : 'gross salary',
)

const heroAmount = computed(() =>
  props.mode === 'gross-to-net' ? props.data.net : props.data.gross,
)

const heroExpandedLines = computed(() => {
  if (props.mode !== 'gross-to-net' || props.taxReturnAmount <= 0) return []
  const yearlyReturn = toYearly(props.taxReturnAmount)
  return [
    {
      label: 'effective monthly',
      value: `${formatEur(props.netWithTaxReturn)}`,
    },
    {
      label: 'yearly return',
      value: `${formatEur(yearlyReturn)}`,
    },
  ]
})

const contextLabel = computed(() => {
  const modeLabel = props.mode === 'gross-to-net' ? 'GROSS \u2192 NET' : 'NET \u2192 GROSS'
  const parts = [modeLabel]
  if (props.placeName) parts.push(props.placeName)
  return parts.join(' \u00B7 ')
})
</script>

<template>
  <div class="flex flex-col">
    <!-- Context header -->
    <div>
      <div class="flex items-center gap-2 mb-1">
        <span class="size-2 rounded-full bg-primary" />
        <span class="text-xs font-unifontex uppercase tracking-wider text-muted">{{ contextLabel }}</span>
      </div>
      <ResultsConversionNote :note="conversionNote" />
    </div>

    <!-- Hero number -->
    <div class="mt-8">
      <ResultsHeroNumber
        :amount="heroAmount"
        :label="heroLabel"
        expand-label="with tax return"
        :expanded-lines="heroExpandedLines"
      />
    </div>

    <!-- Breakdown accordion -->
    <div class="mt-10">
      <ResultsBreakdownAccordion :sections="sections" />
    </div>
  </div>
</template>
