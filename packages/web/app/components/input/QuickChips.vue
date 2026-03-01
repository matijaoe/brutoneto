<script setup lang="ts">
defineProps<{
  chips: ReadonlyArray<{ label: string, delta: number, tooltip: string, color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' }>
}>()

const emit = defineEmits<{
  'adjust': [delta: number]
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <UTooltip
      v-for="chip in chips"
      :key="chip.label"
      :text="chip.tooltip"
    >
      <button
        type="button"
        @click="emit('adjust', chip.delta)"
      >
        <UBadge
          :color="chip.color"
          variant="soft"
          size="sm"
          class="cursor-pointer select-none"
        >
          {{ chip.label }}
        </UBadge>
      </button>
    </UTooltip>
  </div>
</template>
