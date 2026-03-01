<script setup lang="ts">
import type { BreakdownSection } from '~/types'

defineProps<{
  sections: BreakdownSection[]
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="section in sections"
      :key="section.title"
      class="border border-default rounded-lg overflow-hidden"
    >
      <UCollapsible>
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-elevated/50 group-data-[state=open]:bg-elevated/50 transition-colors group"
        >
          <span class="font-unifontex text-sm tracking-wide text-muted">{{ section.title }}</span>
          <span class="flex items-center gap-3">
            <span v-if="section.badge" class="text-xs text-dimmed font-unifontex tabular-nums">
              {{ section.badge }}
            </span>
            <UIcon name="mdi:chevron-down" class="size-5 text-dimmed transition-transform group-data-[state=open]:rotate-180" />
          </span>
        </button>

        <template #content>
          <ResultsBreakdownTable :rows="section.rows" />
        </template>
      </UCollapsible>
    </div>
  </div>
</template>
