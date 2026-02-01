<script setup lang="ts">
import type { Place } from '@brutoneto/core'
import { useClipboard, useStorage } from '@vueuse/core'

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
const emit = defineEmits<{
  (event: 'update:period', value: 'yearly' | 'monthly'): void
}>()

const amountByMode = useStorage<Record<Mode, string>>('salary-amounts', {
  'gross-to-net': '',
  'net-to-gross': '',
})
const selectedPlaceKey = toRef(props, 'selectedPlaceKey')
const period = computed({
  get: () => props.period,
  set: (value: 'yearly' | 'monthly') => emit('update:period', value),
})
const mode = toRef(props, 'mode')

const amount = computed({
  get: () => amountByMode.value[mode.value] ?? '',
  set: (value: string) => {
    amountByMode.value = {
      ...amountByMode.value,
      [mode.value]: value,
    }
  },
})

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
const formattedData = computed(() =>
  data.value ? JSON.stringify(data.value, null, 2) : '',
)
const { copy, copied } = useClipboard({ copiedDuring: 1200 })

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

const hasBlurredOnce = ref(false)
const showPeriodHint = computed(() => {
  if (!hasBlurredOnce.value) {
    return null
  }
  if (!Number.isFinite(amountNumber.value)) {
    return null
  }
  if (period.value === 'yearly' && amountNumber.value > 0 && amountNumber.value < 10000) {
    return {
      text: 'Switch to monthly?',
      next: 'monthly' as const,
    }
  }
  if (period.value === 'monthly' && amountNumber.value >= 10000) {
    return {
      text: 'Switch to yearly?',
      next: 'yearly' as const,
    }
  }
  return null
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
    <form @submit.prevent="handleCalculate">
      <UInput
        v-model="amount"
        icon="mdi:currency-eur"
        type="number"
        :placeholder="placeholder"
        size="lg"
        :ui="{ trailing: 'pe-1!' }"
        :autofocus="autofocus"
        @blur="hasBlurredOnce = true"
      >
        <template #trailing>
          <UButton
            color="primary"
            variant="link"
            size="lg"
            icon="mdi:send"
            type="submit"
          />
        </template>
      </UInput>
    </form>
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <UButton
        v-if="showPeriodHint"
        variant="link"
        size="xs"
        color="neutral"
        class="px-0"
        @click="period = showPeriodHint.next"
      >
        {{ showPeriodHint.text }}
      </UButton>
    </Transition>

    <section v-if="data" class="mt-3 flex flex-col gap-3">
      <div class="grid md:grid-cols-2 gap-3">
        <UCard>
          <template #header>
            <h2
              class="text-base font-bold uppercase font-unifontex text-foreground"
            >
              Gross
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                <span class="text-foreground">
                  {{ formatCurrency(data.gross) }}
                </span>
                <span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatCurrency(grossYearly) }} /yr
              </p>
            </div>
          </template>
        </UCard>
        <UCard>
          <template #header>
            <h2
              class="text-base font-bold uppercase font-unifontex"
            >
              Net
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                <span class="text-foreground">
                  {{ formatCurrency(data.net) }}
                </span>
                <span class="text-base text-muted">/mo</span>
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
            <div class="p-2 -mx-1">
              <UCard>
                <div class="flex items-center justify-between gap-2 pb-2">
                  <p class="text-xs uppercase text-muted">
                    Raw output
                  </p>
                  <UButton
                    :label="copied ? 'Copied' : 'Copy'"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    icon="mdi:content-copy"
                    @click="copy(formattedData)"
                  />
                </div>
                <pre class="font-mono text-xs whitespace-pre-wrap">{{ formattedData }}</pre>
              </UCard>
            </div>
          </template>
        </UCollapsible>
      </div>
    </section>
  </div>
</template>
