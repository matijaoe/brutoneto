<script setup lang="ts">
import type { Place } from '@brutoneto/core'
import { useLocalStorage } from '@vueuse/core'

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
const periodCookie = useCookie<'yearly' | 'monthly'>('period', {
  default: () => 'monthly',
})
const period = computed<'yearly' | 'monthly'>({
  get: () => (route.query.period === 'yr' ? 'yearly' : periodCookie.value),
  set: (value) => {
    periodCookie.value = value
    replaceQuery({ period: value === 'yearly' ? 'yr' : undefined })
  },
})

const taxReturnPercent = useLocalStorage<number>('tax-return-percent', 0)
const hasMounted = ref(false)
onMounted(() => hasMounted.value = true)

const taxReturnOptions = [
  { label: 'None', value: 0 },
  { label: '50%', value: 50 },
  { label: '100%', value: 100 },
]

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
          v-show="isActiveMode('gross-to-net')"
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
        <UFormField
          label="Tax return"
          :ui="{ label: 'text-sm' }"
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
              @click="taxReturnPercent = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
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
          :tax-return-percent="taxReturnPercent"
          autofocus
        />

        <DooCalculator
          v-else
          v-model:period="period"
          :selected-place-key="selectedPlaceKey"
          :tax-return-percent="taxReturnPercent"
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
