<script setup lang="ts">
import type { Place } from '@brutoneto/core'

const props = defineProps<{
  selectedPlaceKey: Place
  period: 'yearly' | 'monthly'
}>()
</script>

<template>
  <SalaryCalculator
    mode="net-to-gross"
    :selected-place-key="props.selectedPlaceKey"
    :period="props.period"
    placeholder="2200"
    autofocus
  />
</template>
