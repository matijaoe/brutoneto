<script setup lang="ts">
import type { Place } from '@brutoneto/core'

type Mode = 'gross-to-net' | 'net-to-gross'

type Props = {
  mode: Mode
  selectedPlaceKey: Place
  period: 'yearly' | 'monthly'
  placeholder?: string
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  autofocus: false,
})

const amount = ref('')
const selectedPlaceKey = toRef(props, 'selectedPlaceKey')
const period = toRef(props, 'period')
const mode = toRef(props, 'mode')

const endpoint = computed(() => (mode.value === 'gross-to-net' ? 'neto' : 'bruto'))
const toYearly = (value: number) => value * 12
const amountNumber = computed(() => Number(amount.value))
const grossYearly = computed(() => {
  if (period.value === 'yearly' && Number.isFinite(amountNumber.value)) {
    return amountNumber.value
  }
  return toYearly(data.value?.gross ?? 0)
})
const netYearly = computed(() => toYearly(data.value?.net ?? 0))

const { data, execute: calculate } = useFetch<{ net: number, gross: number }>(
  () => `/api/${endpoint.value}/${amount.value}`,
  {
    method: 'GET',
    query: {
      detailed: true,
      yearly: computed(() => (period.value === 'yearly' ? 'true' : null)),
      place: selectedPlaceKey,
    },
    transform: (data) => data,
    immediate: false,
    watch: false,
    lazy: true,
  },
)

const isInputValid = computed(() => {
  return amount.value && Number(amount.value) > 0
})

const handleCalculate = () => {
  if (!isInputValid.value) {
    return
  }
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
    <form class="mt-4" @submit.prevent="handleCalculate">
      <UInput
        v-model="amount"
        icon="mdi:currency-eur"
        type="number"
        :placeholder="placeholder"
        size="md"
        :autofocus="autofocus"
      >
        <template #trailing>
          <UButton
            :disabled="!isInputValid"
            color="primary"
            variant="link"
            size="sm"
            icon="mdi:send"
            type="submit"
          />
        </template>
      </UInput>
    </form>

    <section v-if="data" class="mt-8 flex flex-col gap-4">
      <div class="grid md:grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <h2 class="text-base font-bold uppercase text-muted font-unifontex">
              Gross
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                {{ formatCurrency(data.gross) }}<span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatCurrency(grossYearly) }} /yr
              </p>
            </div>
          </template>
        </UCard>
        <UCard>
          <template #header>
            <h2 class="text-base font-bold uppercase text-muted font-unifontex">
              Net
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                {{ formatCurrency(data.net) }}<span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatCurrency(netYearly) }} /yr
              </p>
            </div>
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
            <div class="p-2">
              <UCard>
                <pre class="font-mono">{{ data }}</pre>
              </UCard>
            </div>
          </template>
        </UCollapsible>
      </div>
    </section>
  </div>
</template>
