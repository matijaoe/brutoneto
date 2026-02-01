<script setup lang="ts">
import type { Place } from '@brutoneto/core'

const props = defineProps<{
  selectedPlaceKey: Place
  period: 'yearly' | 'monthly'
}>()
</script>

<template>
  <SalaryCalculator
    mode="gross-to-net"
    :selected-place-key="props.selectedPlaceKey"
    :period="props.period"
    placeholder="3000"
    autofocus
  />
</template>
