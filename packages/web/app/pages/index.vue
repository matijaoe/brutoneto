<script setup lang="ts">
import type { Place } from '@brutoneto/core'

const gross = ref('')

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

const { data, execute: calculate } = useFetch<{ net: number, gross: number }>(() => `/api/neto/${gross.value}`, {
  method: 'GET',
  query: {
    detailed: true,
    yearly: computed(() => period.value === 'yearly' ? 'true' : null),
    place: selectedPlaceKey,
  },
  transform: (data) => data,
  immediate: false,
  watch: false,
  lazy: true,
})

const handleCalculate = () => {
  if (!gross.value || Number(gross.value) <= 0) return
  calculate()
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">
      Brutoneto
    </h1>

    <div class="mt-8">
      <div class="flex items-center gap-4">
        <USelect
          v-model="period"
          :items="['monthly', 'yearly']"
          size="md"
        />
        <USelect
          v-model="selectedPlaceKey"
          class="w-max"
          label-key="name"
          value-key="key"
          :items="places"
          size="md"
          :disabled="!places"
          :loading="taxesStatus === 'pending'"
          :ui="{ content: 'w-fit max-w-[260px]' }"
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
        </USelect>
      </div>

      <form class="mt-4" @submit.prevent="handleCalculate">
        <UInput
          v-model="gross"
          icon="mdi:currency-eur"
          type="number"
          placeholder="3000"
          size="md"
        >
          <template #trailing>
            <UButton
              color="primary"
              variant="link"
              size="sm"
              icon="mdi:send"
              type="submit"
            />
          </template>
        </UInput>
      </form>
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

    <section v-if="data" class="mt-8 flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <h2 class="text-sm font-bold uppercase text-muted">
              Gross
            </h2>
            <p class="text-3xl">
              {{ formatCurrency(data.gross) }}
            </p>
          </template>
        </UCard>
        <UCard>
          <template #header>
            <h2 class="text-sm font-bold uppercase text-muted">
              Net
            </h2>
            <p class="text-3xl">
              {{ formatCurrency(data.net) }}
            </p>
          </template>
        </UCard>
      </div>

      <div>
        <UCollapsible>
          <UButton
            label="Data"
            color="neutral"
            variant="ghost"
            trailing-icon="mdi:chevron-down"
            block
          />

          <template #content>
            <pre>{{ data }}</pre>
          </template>
        </UCollapsible>
      </div>
    </section>
  </div>
</template>
