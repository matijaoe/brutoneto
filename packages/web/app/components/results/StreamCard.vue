<script setup lang="ts">
import { formatEur, toYearly } from '~/utils/formatters'

const props = defineProps<{
  label: string
  /** Always the monthly amount */
  amount: number
  badge?: string
  color: 'neutral' | 'purple' | 'green'
  subtitle?: string
}>()

const yearlyAmount = computed(() => toYearly(props.amount))

const borderColor = computed(() => {
  switch (props.color) {
    case 'purple': return 'border-l-purple-500'
    case 'green': return 'border-l-green-500'
    default: return 'border-l-neutral-400 dark:border-l-neutral-500'
  }
})

const accentColor = computed(() => {
  switch (props.color) {
    case 'purple': return 'text-purple-400'
    case 'green': return 'text-green-400'
    default: return 'text-muted'
  }
})
</script>

<template>
  <div
    class="rounded-lg border border-default bg-default p-4 border-l-3"
    :class="borderColor"
  >
    <div class="flex items-start justify-between gap-2">
      <p class="text-xs font-unifontex uppercase tracking-wider" :class="accentColor">
        {{ label }}
      </p>
      <span
        v-if="badge"
        class="text-sm font-bold font-unifontex"
        :class="accentColor"
      >
        {{ badge }}
      </span>
    </div>
    <p class="text-3xl font-unifontex mt-1 text-foreground tabular-nums">
      {{ formatEur(amount) }}
      <span class="text-sm text-muted">/mo</span>
    </p>
    <p class="text-sm text-muted font-unifontex mt-0.5 tabular-nums">
      {{ formatEur(yearlyAmount) }} /yr
    </p>
    <p v-if="subtitle" class="text-xs text-dimmed mt-1.5">
      {{ subtitle }}
    </p>
  </div>
</template>
