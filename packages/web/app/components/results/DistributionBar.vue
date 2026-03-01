<script setup lang="ts">
const props = defineProps<{
  segments: Array<{ label: string, value: number, color: 'neutral' | 'purple' | 'green' | 'red' }>
}>()

const total = computed(() => props.segments.reduce((sum, s) => sum + s.value, 0))

const visibleSegments = computed(() =>
  props.segments.filter(s => s.value > 0).map(s => ({
    ...s,
    percent: total.value > 0 ? (s.value / total.value) * 100 : 0,
  })),
)

const colorMap: Record<string, string> = {
  neutral: 'bg-neutral-400 dark:bg-neutral-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
}
</script>

<template>
  <div v-if="visibleSegments.length > 0">
    <div class="flex h-2.5 rounded-full overflow-hidden gap-0.5">
      <div
        v-for="(seg, i) in visibleSegments"
        :key="i"
        class="transition-all duration-400 ease-in-out"
        :class="colorMap[seg.color] || 'bg-neutral-400'"
        :style="{ width: `${seg.percent}%` }"
      />
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2">
      <div
        v-for="(seg, i) in visibleSegments"
        :key="i"
        class="flex items-center gap-1.5 text-xs text-dimmed"
      >
        <span
          class="size-2 rounded-full shrink-0"
          :class="colorMap[seg.color] || 'bg-neutral-400'"
        />
        {{ seg.label }}
      </div>
    </div>
  </div>
</template>
