<script setup lang="ts">
import type { Place } from '@brutoneto/core'
import type { BrutoType, Mode, Period } from '~/types'

defineProps<{
  period: Period
  selectedPlaceKey: Place
  brutoType: BrutoType
  taxReturnPercent: number
  mode: Mode
  places: Array<{ key: Place, name: string, taxRateLow: number, taxRateHigh: number }> | undefined
  placesLoading: boolean
}>()

// Prevents SSR hydration mismatch on useLocalStorage-backed taxReturnPercent
const hasMounted = ref(false)
onMounted(() => { hasMounted.value = true })

const emit = defineEmits<{
  'update:period': [value: Period]
  'update:selectedPlaceKey': [value: Place]
  'update:brutoType': [value: BrutoType]
  'update:taxReturnPercent': [value: number]
}>()

const taxReturnOptions = [
  { label: 'None', value: 0 },
  { label: '50%', value: 50 },
  { label: '100%', value: 100 },
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField
      label="Tax region"
      :ui="{ label: 'text-sm text-dimmed' }"
    >
      <USelectMenu
        :model-value="selectedPlaceKey"
        class="w-full"
        label-key="name"
        value-key="key"
        :items="places"
        size="lg"
        :disabled="!places"
        :loading="placesLoading"
        :ui="{ content: 'w-[var(--reka-popper-anchor-width)]' }"
        virtualize
        @update:model-value="emit('update:selectedPlaceKey', $event as Place)"
      >
        <template #item="{ item }">
          <div class="flex items-center justify-between gap-2 w-full">
            <p class="grow whitespace-nowrap truncate" :title="item.name">
              {{ item.name }}
            </p>
            <div class="flex flex-nowrap gap-1 ml-auto">
              <UBadge color="primary" variant="subtle" size="xs">
                {{ Math.round(item.taxRateLow * 100) }}%
              </UBadge>
              <UBadge color="error" variant="subtle" size="xs">
                {{ Math.round(item.taxRateHigh * 100) }}%
              </UBadge>
            </div>
          </div>
        </template>
      </USelectMenu>
    </UFormField>

    <div class="flex flex-wrap items-end gap-3">
      <UFormField
        label="Period"
        :ui="{ label: 'text-sm text-dimmed' }"
      >
        <USelect
          :model-value="period"
          class="w-32"
          :ui="{ content: 'w-32' }"
          :items="['monthly', 'yearly']"
          size="lg"
          @update:model-value="emit('update:period', $event as Period)"
        />
      </UFormField>

      <UFormField
        v-show="mode === 'gross-to-net'"
        label="Type"
        :ui="{ label: 'text-sm text-dimmed' }"
      >
        <USelect
          :model-value="brutoType"
          class="w-36"
          :ui="{ content: 'w-36' }"
          :items="[
            { label: 'Bruto 1', value: 'bruto1' },
            { label: 'Bruto 2', value: 'bruto2' },
          ]"
          size="lg"
          @update:model-value="emit('update:brutoType', $event as BrutoType)"
        />
      </UFormField>

      <UFormField
        label="Tax return"
        :ui="{ label: 'text-sm text-dimmed' }"
      >
        <div class="flex">
          <button
            v-for="(opt, i) in taxReturnOptions"
            :key="opt.value"
            type="button"
            class="relative px-3.5 py-2 text-sm border cursor-pointer transition-colors"
            :class="[
              hasMounted && taxReturnPercent === opt.value
                ? 'z-10 border-primary bg-primary/10 text-primary font-medium'
                : 'border-muted text-dimmed hover:text-foreground hover:border-accented',
              i === 0 ? 'rounded-l-md' : '',
              i === taxReturnOptions.length - 1 ? 'rounded-r-md' : '',
              i > 0 ? '-ml-px' : '',
            ]"
            @click="emit('update:taxReturnPercent', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </UFormField>
    </div>
  </div>
</template>
