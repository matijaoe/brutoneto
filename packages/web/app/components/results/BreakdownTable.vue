<script setup lang="ts">
import type { BreakdownRow } from '~/types'

defineProps<{
  rows: BreakdownRow[]
}>()

const summaryBorderColor: Record<string, string> = {
  neutral: 'border-l-neutral-400 dark:border-l-neutral-500 bg-neutral-500/5',
  purple: 'border-l-purple-500 bg-purple-500/5',
  green: 'border-l-green-500 bg-green-500/5',
  red: 'border-l-red-500 bg-red-500/5',
}
</script>

<template>
  <div class="flex flex-col">
    <template v-for="(row, i) in rows" :key="i">
      <!-- Sub-heading -->
      <div
        v-if="row.type === 'sub-heading'"
        class="px-5 pt-4 pb-1.5 border-b border-default/40"
      >
        <span class="text-xs uppercase text-muted tracking-wider font-semibold">
          {{ row.label }}
        </span>
      </div>

      <!-- Summary row -->
      <div
        v-else-if="row.type === 'summary'"
        class="flex items-center justify-between px-5 py-2.5 mt-1 mb-1 rounded-md border-l-3"
        :class="row.color ? summaryBorderColor[row.color] : 'bg-elevated'"
      >
        <span
          class="text-sm font-bold"
          :class="row.color === 'purple' ? 'text-purple-400' : row.color === 'green' ? 'text-green-400' : 'text-foreground'"
        >
          {{ row.label }}
        </span>
        <span
          class="text-sm font-mono font-bold tabular-nums"
          :class="row.color === 'purple' ? 'text-purple-400' : row.color === 'green' ? 'text-green-400' : 'text-foreground'"
        >
          {{ row.value }}
        </span>
      </div>

      <!-- Primary row -->
      <div
        v-else-if="row.type === 'primary'"
        class="flex items-center justify-between px-5 py-2.5 border-b border-default/40"
      >
        <span class="text-sm text-foreground">{{ row.label }}</span>
        <span class="text-sm font-mono font-medium text-foreground tabular-nums">
          {{ row.value }}
        </span>
      </div>

      <!-- Supporting row -->
      <div
        v-else
        class="flex items-center justify-between px-5 py-2.5 border-b border-default/40"
      >
        <span class="text-sm flex items-center gap-2">
          <span :class="row.color === 'green' ? 'text-green-500' : 'text-dimmed'">
            {{ row.label }}
          </span>
          <span v-if="row.color === 'green'" class="text-xs text-dimmed">tax return</span>
        </span>
        <span
          class="text-sm font-mono tabular-nums"
          :class="row.color === 'green' ? 'text-green-500' : 'text-dimmed'"
        >
          {{ row.value }}
        </span>
      </div>
    </template>
  </div>
</template>
