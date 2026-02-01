<script setup lang="ts">
import type { Place } from '@brutoneto/core'

type Mode = 'gross-to-net' | 'net-to-gross'

const mode = ref<Mode>('gross-to-net')
const isActiveMode = (value: Mode) => mode.value === value
const selectedPlaceKey = useCookie<Place>('place', {
  default: () => 'sveta-nedelja-samobor',
})
const period = useCookie<'yearly' | 'monthly'>('period', {
  default: () => 'monthly',
})

const { data: taxesRes, status: taxesStatus } = useFetch<{ places: {
  key: Place
  name: string
  taxRateLow: number
  taxRateHigh: number
}[] }>('/api/taxes', {
  method: 'GET',
})
const places = computed(() => taxesRes.value?.places)
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold font-unifontex uppercase">
      Bruto<span class="text-primary italic">neto</span>
    </h1>

    <div class="mt-8">
      <div class="flex">
        <UFieldGroup>
          <UButton
            label="Gross → Net"
            :variant="isActiveMode('gross-to-net') ? 'solid' : 'soft'"
            color="primary"
            size="sm"
            @click="mode = 'gross-to-net'"
          />
          <UButton
            label="Net → Gross"
            :variant="isActiveMode('net-to-gross') ? 'solid' : 'soft'"
            color="primary"
            size="sm"
            @click="mode = 'net-to-gross'"
          />
        </UFieldGroup>
      </div>

      <div class="mt-4 flex items-center gap-4">
        <USelect
          v-model="period"
          :items="['monthly', 'yearly']"
          size="md"
        />
        <USelectMenu
          v-model="selectedPlaceKey"
          class="w-full sm:w-64"
          label-key="name"
          value-key="key"
          :items="places"
          size="md"
          :disabled="!places"
          :loading="taxesStatus === 'pending'"
          :ui="{ content: 'w-full sm:w-64' }"
        >
          <template #item="{ item }">
            <div class="flex items-center justify-between gap-2 w-full">
              <p class="grow whitespace-nowrap truncate">
                {{ item.name }}
              </p>

              <div class="flex flex-nowrap gap-1 ml-auto">
                <UBadge
                  color="primary"
                  variant="subtle"
                  size="xs"
                >
                  {{ Math.round(item.taxRateLow * 100) }}%
                </UBadge>
                <UBadge
                  color="error"
                  variant="subtle"
                  size="xs"
                >
                  {{ Math.round(item.taxRateHigh * 100) }}%
                </UBadge>
              </div>
            </div>
          </template>
        </USelectMenu>
      </div>

      <GrossToNetCalculator
        v-if="isActiveMode('gross-to-net')"
        :selected-place-key="selectedPlaceKey"
        :period="period"
      />
      <NetToGrossCalculator
        v-else
        :selected-place-key="selectedPlaceKey"
        :period="period"
      />
    </div>

    <UCollapsible v-if="taxesRes">
      <template #content>
        <div v-for="place in places" :key="place.key">
          <h2>{{ place.name }}</h2>
          <p>{{ place.taxRateLow }}</p>
          <p>{{ place.taxRateHigh }}</p>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
