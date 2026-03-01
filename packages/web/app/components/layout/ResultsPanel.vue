<script setup lang="ts">
defineProps<{
  hasData: boolean
  error?: string | null
}>()
</script>

<template>
  <div class="flex-1 min-w-0 max-w-[40rem]">
    <slot v-if="hasData" />
    <div v-else class="flex items-center justify-center min-h-[200px] lg:min-h-[400px]">
      <p v-if="error" class="text-error text-sm">
        Calculation failed. Please try again.
      </p>
      <p v-else class="text-dimmed text-sm">
        Enter an amount to get started
      </p>
    </div>
  </div>
</template>
