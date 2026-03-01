<script setup lang="ts">
import { formatEur, toYearly } from '~/utils/formatters'

const props = defineProps<{
  /** Always the monthly amount */
  amount: number
  label: string
  /** Always-visible secondary line below yearly (e.g. "Incl. retained") */
  secondaryLine?: { label: string, value: string }
  expandLabel?: string
  expandedLines?: Array<{ label: string, value: string, subtitle?: string }>
}>()

const yearlyAmount = computed(() => toYearly(props.amount))
const hasExpanded = computed(() => props.expandedLines && props.expandedLines.length > 0)
</script>

<template>
  <div>
    <p class="text-sm font-unifontex uppercase tracking-widest text-muted mb-2">
      MONTHLY {{ label }}
    </p>
    <p class="flex items-baseline gap-3 tabular-nums">
      <span class="text-6xl lg:text-7xl font-unifontex text-foreground">{{ formatEur(amount) }}</span>
    </p>
    <p class="text-base text-muted font-unifontex mt-2 tabular-nums">
      {{ formatEur(yearlyAmount) }} /yr
    </p>

    <!-- Always-visible secondary line (e.g. incl. retained) -->
    <p v-if="secondaryLine" class="text-sm text-muted font-unifontex mt-2 tabular-nums">
      {{ secondaryLine.label }} <span class="text-foreground">{{ secondaryLine.value }}</span>
    </p>

    <UCollapsible v-if="hasExpanded" class="mt-5">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-default text-xs text-dimmed hover:text-muted hover:border-accented transition-colors cursor-pointer"
      >
        <span class="text-[10px]">&#x25BE;</span>
        <span class="font-unifontex">{{ expandLabel || 'with adjustments' }}</span>
      </button>
      <template #content>
        <div class="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          <div
            v-for="line in expandedLines"
            :key="line.label"
            class="tabular-nums"
          >
            <p class="text-xs font-unifontex uppercase tracking-wider text-dimmed mb-0.5">
              {{ line.label }}
            </p>
            <p class="text-base font-unifontex text-foreground">
              {{ line.value }}
            </p>
            <p v-if="line.subtitle" class="text-xs font-unifontex text-muted mt-0.5">
              {{ line.subtitle }}
            </p>
          </div>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
