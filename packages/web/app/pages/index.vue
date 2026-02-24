<script setup lang="ts">
import type { Place } from '@brutoneto/core'

type Mode = 'gross-to-net' | 'net-to-gross' | 'doo'
type BrutoType = 'bruto1' | 'bruto2'

const route = useRoute()
const router = useRouter()

function replaceQuery(updates: Record<string, string | undefined>) {
  const query = { ...route.query }
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete query[key]
    } else {
      query[key] = value
    }
  }
  router.replace({ query })
}

const mode = computed<Mode>({
  get: () => {
    if (route.query.mode === 'doo') return 'doo'
    if (route.query.mode === 'nb') return 'net-to-gross'
    return 'gross-to-net'
  },
  set: (value) => {
    const modeParam = value === 'doo' ? 'doo' : value === 'net-to-gross' ? 'nb' : undefined
    replaceQuery({ mode: modeParam, bruto: undefined })
  },
})
const isActiveMode = (value: Mode) => mode.value === value
const brutoType = computed<BrutoType>({
  get: () => (route.query.bruto === '2' ? 'bruto2' : 'bruto1'),
  set: (value) => {
    replaceQuery({ bruto: value === 'bruto2' ? '2' : undefined })
  },
})
const selectedPlaceKey = useCookie<Place>('place', {
  default: () => 'sveta-nedelja-samobor',
})
const period = computed<'yearly' | 'monthly'>({
  get: () => (route.query.period === 'yr' ? 'yearly' : 'monthly'),
  set: (value) => {
    replaceQuery({ period: value === 'yearly' ? 'yr' : undefined })
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
    <h1 class="text-3xl font-bold font-unifontex uppercase text-center sm:text-left">
      Bruto<span class="text-primary italic">neto</span>
    </h1>

    <div class="mt-6">
      <ModeSwitcher v-model:mode="mode" class="justify-center sm:justify-start" />

      <div class="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <UFormField
          label="Period"
          :ui="{ label: 'text-sm' }"
        >
          <USelect
            v-model="period"
            class="w-full sm:w-32"
            :ui="{ content: 'w-full sm:w-32' }"
            :items="['monthly', 'yearly']"
            size="lg"
          />
        </UFormField>
        <UFormField
          label="Tax"
          :ui="{ label: 'text-sm' }"
        >
          <USelectMenu
            v-model="selectedPlaceKey"
            class="w-full sm:w-64"
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
        </UFormField>
        <UFormField
          v-if="isActiveMode('gross-to-net')"
          label="Type"
          :ui="{ label: 'text-sm' }"
        >
          <USelect
            v-model="brutoType"
            class="w-full sm:w-36"
            :ui="{ content: 'w-full sm:w-36' }"
            :items="[
              { label: 'Bruto 1', value: 'bruto1' },
              { label: 'Bruto 2', value: 'bruto2' },
            ]"
            size="lg"
          />
        </UFormField>
      </div>

      <section class="mt-3">
        <SalaryCalculator
          v-if="mode !== 'doo'"
          v-model:period="period"
          :mode="mode"
          :bruto-type="isActiveMode('gross-to-net') ? brutoType : 'bruto1'"
          :selected-place-key="selectedPlaceKey"
          :placeholder="isActiveMode('gross-to-net') ? (brutoType === 'bruto2' ? '4660' : '3000') : '2200'"
          autofocus
        />

        <DooCalculator
          v-else
          v-model:period="period"
          :selected-place-key="selectedPlaceKey"
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
