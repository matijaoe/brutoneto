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
          class="w-full flex items-center justify-between px-5 py-3 cursor-pointer bg-elevated/50 hover:bg-elevated/80 transition-colors group"
        >
          <span class="font-unifontex text-sm tracking-wide text-muted shrink-0">{{ section.title }}</span>
          <span class="flex items-center gap-3 min-w-0">
            <span v-if="section.badge" class="hidden sm:inline text-sm text-dimmed font-unifontex tabular-nums truncate">
              {{ section.badge }}
            </span>
            <UIcon name="mdi:chevron-down" class="size-5 text-dimmed shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </span>
        </button>

        <template #content>
          <ResultsBreakdownTable :rows="section.rows" />
        </template>
      </UCollapsible>
    </div>
  </div>
</template>
