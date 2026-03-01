<script setup lang="ts">
import type { Mode } from '~/types'

const props = defineProps<{
  mode: Mode
}>()

const label = computed(() => {
  switch (props.mode) {
    case 'gross-to-net': return 'GROSS \u2192 NET'
    case 'net-to-gross': return 'NET \u2192 GROSS'
    case 'doo': return 'D.O.O. CALCULATOR'
  }
})

const description = computed(() => {
  switch (props.mode) {
    case 'gross-to-net': return 'Calculate your net salary from gross amount.'
    case 'net-to-gross': return 'Find the gross needed for your desired net.'
    case 'doo': return 'Personal company with director\'s salary and dividend distribution.'
  }
})
</script>

<template>
  <div>
    <p class="text-xs font-unifontex uppercase tracking-wider text-muted">
      {{ label }}
    </p>
    <p class="text-sm text-dimmed mt-1">
      {{ description }}
    </p>
  </div>
</template>
