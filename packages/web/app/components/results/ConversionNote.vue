<script setup lang="ts">
import type { ConversionNote } from '~/types'

defineProps<{
  note: ConversionNote | null
}>()
</script>

<template>
  <p v-if="note" class="text-sm text-dimmed font-unifontex tabular-nums">
    <span class="text-muted">&cularr;</span>
    {{ note.input }} &approx; {{ note.eur }}
    <span v-if="note.monthlyEur" class="text-xs">({{ note.monthlyEur }})</span>
  </p>
</template>
