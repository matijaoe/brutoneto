<script setup lang="ts">
import type { Place } from '@brutoneto/core'

type Mode = 'gross-to-net' | 'net-to-gross'

const params = useUrlSearchParams('history')

const mode = computed<Mode>({
  get: () => (params.mode === 'nb' ? 'net-to-gross' : 'gross-to-net'),
  set: (value) => {
    if (value === 'net-to-gross') {
      params.mode = 'nb'
    } else {
      delete params.mode
    }
  },
})
const isActiveMode = (value: Mode) => mode.value === value
const arrowIcon = computed(() =>
  isActiveMode('gross-to-net') ? 'mdi:arrow-right' : 'mdi:arrow-left',
)
const selectedPlaceKey = useCookie<Place>('place', {
  default: () => 'sveta-nedelja-samobor',
})
const period = computed<'yearly' | 'monthly'>({
  get: () => (params.period === 'yr' ? 'yearly' : 'monthly'),
  set: (value) => {
    if (value === 'yearly') {
      params.period = 'yr'
    } else {
      delete params.period
    }
  },
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

    <div class="mt-6">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-2 py-2 -ml-2">
          <UTooltip
            text="Calculate gross (net → gross)" :content="{
              side: 'top',
            }"
          >
            <button @click="mode = 'net-to-gross'">
              <span
                class="text-lg uppercase tracking-wide font-unifontex"
                :class="isActiveMode('net-to-gross') ? 'text-foreground font-bold' : 'text-muted'"
              >
                Gross
              </span>
            </button>
          </UTooltip>
          <UTooltip
            text="Switch mode" :content="{
              side: 'top',
            }"
          >
            <UButton
              color="primary"
              variant="link"
              size="xl"
              :icon="isActiveMode('net-to-gross') ? 'mdi:arrow-left' : 'mdi:arrow-right'"
              @click="mode = isActiveMode('net-to-gross') ? 'gross-to-net' : 'net-to-gross'"
            />
          </UTooltip>
          <UTooltip
            text="Calculate net (gross → net)" :content="{
              side: 'top',
            }"
          >
            <button @click="mode = 'gross-to-net'">
              <span
                class="text-lg uppercase tracking-wide font-unifontex"
                :class="isActiveMode('gross-to-net') ? 'text-foreground font-bold' : 'text-muted'"
              >
                Net
              </span>
            </button>
          </UTooltip>
        </div>
      </div>

      <div class="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <USelect
          v-model="period"
          class="w-full sm:w-32"
          :ui="{ content: 'w-full sm:w-32' }"
          :items="['monthly', 'yearly']"
          size="lg"
        />
        <USelectMenu
          v-model="selectedPlaceKey"
          class="w-full sm:w-52"
          label-key="name"
          value-key="key"
          :items="places"
          size="lg"
          :disabled="!places"
          :loading="taxesStatus === 'pending'"
          :ui="{ content: 'w-full sm:w-64' }"
          virtualize
        >
          <template #item="{ item }">
            <div class="flex items-center justify-between gap-2 w-full">
              <p class="grow whitespace-nowrap truncate" :title="item.name">
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

      <section class="mt-3">
        <SalaryCalculator
          v-model:period="period"
          :mode="mode"
          :selected-place-key="selectedPlaceKey"
          :placeholder="isActiveMode('gross-to-net') ? '3000' : '2200'"
          autofocus
        />
      </section>
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
