<script setup lang="ts">
import { DIRECTOR_MINIMUM_GROSS } from '@brutoneto/core'

const props = defineProps<{
  directorGross: string
  dividendPercentage: string
  directorGrossError: string | undefined
  dividendPercentageError: string | undefined
  isAtMinimum: boolean
}>()

const emit = defineEmits<{
  'update:directorGross': [value: string]
  'update:dividendPercentage': [value: string]
  'setMinimumSalary': []
}>()

const dividendPresets = ['60', '70', '80', '90', '100']

const isPreset = computed(() => dividendPresets.includes(props.dividendPercentage))
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField
      label="Director's gross salary (Bruto 1)"
      :error="directorGrossError"
      :ui="{ label: 'text-sm text-dimmed' }"
    >
      <UInput
        :model-value="directorGross"
        icon="mdi:currency-eur"
        type="number"
        :placeholder="String(DIRECTOR_MINIMUM_GROSS)"
        size="lg"
        class="w-full"
        :ui="{ trailing: 'pe-1.5!' }"
        :color="directorGrossError ? 'error' : undefined"
        @update:model-value="emit('update:directorGross', $event as string)"
      >
        <template #trailing>
          <UTooltip :text="`Set to minimum (€${DIRECTOR_MINIMUM_GROSS})`">
            <button
              v-if="!isAtMinimum"
              type="button"
              class="text-xs text-primary hover:text-primary/80 cursor-pointer whitespace-nowrap font-medium"
              @click="emit('setMinimumSalary')"
            >
              min
            </button>
            <span v-else class="text-xs text-dimmed">min</span>
          </UTooltip>
        </template>
      </UInput>
    </UFormField>

    <UFormField
      label="Dividend withdrawal"
      :error="dividendPercentageError"
      :ui="{ label: 'text-sm text-dimmed' }"
    >
      <div class="flex w-full">
        <button
          v-for="(preset, i) in dividendPresets"
          :key="preset"
          type="button"
          class="flex-1 px-1 py-2 text-sm border cursor-pointer transition-colors"
          :class="[
            dividendPercentage === preset
              ? 'z-10 border-primary bg-primary/10 text-primary font-medium'
              : 'border-muted text-dimmed hover:text-foreground hover:border-accented',
            i === 0 ? 'rounded-l-md' : '-ml-px',
          ]"
          @click="emit('update:dividendPercentage', preset)"
        >
          {{ preset }}%
        </button>
        <div class="relative -ml-px flex-1">
          <input
            :value="isPreset ? '' : dividendPercentage"
            type="number"
            placeholder="%"
            aria-label="Custom dividend percentage"
            min="0"
            max="100"
            class="w-full h-full px-2 text-sm text-center border rounded-r-md bg-transparent outline-none transition-colors"
            :class="[
              !isPreset && dividendPercentage
                ? 'z-10 border-primary bg-primary/10 text-primary font-medium'
                : 'border-muted text-dimmed hover:border-accented placeholder-dimmed',
            ]"
            @input="emit('update:dividendPercentage', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </UFormField>
  </div>
</template>
