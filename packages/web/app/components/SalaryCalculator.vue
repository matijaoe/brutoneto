<script setup lang="ts">
import type { Place } from '@brutoneto/core'
import type { InputCurrency } from '~/composables/useCurrency'
import { useClipboard, useStorage } from '@vueuse/core'

type Mode = 'gross-to-net' | 'net-to-gross'
type BrutoType = 'bruto1' | 'bruto2'

type Props = {
  mode: Mode
  brutoType: BrutoType
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

const {
  currency,
  exchangeRate,
  exchangeRateDate,
  isLoadingRate,
  isNonEur,
  convertToEur,
  formatInputCurrency,
  currencyIcon,
} = useCurrency()

const amount = useStorage<string>('salary-amount', '')
const selectedPlaceKey = toRef(props, 'selectedPlaceKey')
const period = computed({
  get: () => props.period,
  set: (value: 'yearly' | 'monthly') => emit('update:period', value),
})
const mode = toRef(props, 'mode')
const inputRef = ref<any>(null)
const getInputEl = () =>
  (inputRef.value?.$el as HTMLElement | undefined)?.querySelector?.('input') as HTMLInputElement | null

const endpoint = computed(() => {
  if (mode.value === 'gross-to-net' && props.brutoType === 'bruto2') return 'neto/bruto2'
  if (mode.value === 'net-to-gross') return 'bruto'
  return 'neto'
})
const toYearly = (value: number) => value * 12
const amountNumber = computed(() => Number(amount.value))
const lastSubmittedEurAmount = ref<number | null>(null)
const lastSubmittedInputAmount = ref<number | null>(null)
const lastSubmittedCurrency = ref<InputCurrency>('EUR')
const lastSubmittedPeriod = ref<'yearly' | 'monthly' | null>(null)
const lastSubmittedRate = ref<number | null>(null)
const apiAmount = ref<string>('')
const amountLabel = computed(() => {
  const periodLabel = period.value === 'yearly' ? 'Yearly' : 'Monthly'
  if (mode.value === 'gross-to-net') {
    return props.brutoType === 'bruto2'
      ? `${periodLabel} gross 2 amount (total employer cost)`
      : `${periodLabel} gross amount`
  }
  return `${periodLabel} net amount`
})
const grossYearly = computed(() => {
  if (
    mode.value === 'gross-to-net'
    && props.brutoType === 'bruto1'
    && lastSubmittedPeriod.value === 'yearly'
    && lastSubmittedEurAmount.value != null
  ) {
    return lastSubmittedEurAmount.value
  }
  return toYearly(data.value?.gross ?? 0)
})
const netYearly = computed(() => toYearly(data.value?.net ?? 0))
const formattedData = computed(() =>
  data.value ? JSON.stringify(data.value, null, 2) : '',
)
const { copy, copied } = useClipboard({ copiedDuring: 1200 })

const { data, execute: calculate } = useFetch<{ net: number, gross: number }>(
  () => `/api/${endpoint.value}/${apiAmount.value}`,
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

watch(
  () => selectedPlaceKey.value,
  () => {
    if (!hasSubmittedOnce.value || !isInputValid.value) {
      return
    }
    handleCalculate()
  },
)

watch(
  () => props.brutoType,
  () => {
    if (!hasSubmittedOnce.value || !isInputValid.value) {
      return
    }
    handleCalculate()
  },
)

const isInputValid = computed(() => {
  return amount.value && Number(amount.value) > 0
})

const hasBlurredOnce = ref(false)
const hasSubmittedOnce = ref(false)
const showPeriodHint = computed(() => {
  if (!Number.isFinite(amountNumber.value)) {
    return null
  }
  if (period.value === 'yearly' && amountNumber.value > 0 && amountNumber.value < 10000) {
    if (!hasBlurredOnce.value && !hasSubmittedOnce.value) {
      return null
    }
    return {
      text: 'Switch to monthly?',
      next: 'monthly' as const,
    }
  }
  if (period.value === 'monthly' && amountNumber.value >= 20000) {
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

  const eurAmount = convertToEur(amountNumber.value)
  if (eurAmount == null && isNonEur.value) {
    // Rate hasn't loaded yet
    return
  }

  const resolvedEur = eurAmount ?? amountNumber.value
  apiAmount.value = String(resolvedEur)
  lastSubmittedEurAmount.value = resolvedEur
  lastSubmittedInputAmount.value = amountNumber.value
  lastSubmittedCurrency.value = currency.value
  lastSubmittedRate.value = exchangeRate.value
  lastSubmittedPeriod.value = period.value
  hasSubmittedOnce.value = true

  calculate()
  getInputEl()?.blur()
}

const updateAmountByPercent = (delta: number) => {
  if (!Number.isFinite(amountNumber.value)) {
    return
  }
  const nextValue = Math.round(amountNumber.value * (1 + delta) * 100) / 100
  amount.value = String(nextValue)
  handleCalculate()
}

const percentChips = [
  { label: '-5%', delta: -0.05, tooltip: 'Subtract 5%', color: 'error' },
  { label: '+5%', delta: 0.05, tooltip: 'Add 5%', color: 'success' },
  { label: '+10%', delta: 0.1, tooltip: 'Add 10%', color: 'success' },
  { label: '+15%', delta: 0.15, tooltip: 'Add 15%', color: 'success' },
] as const

watch(
  () => mode.value,
  async () => {
    data.value = null
    hasSubmittedOnce.value = false
    lastSubmittedEurAmount.value = null
    lastSubmittedInputAmount.value = null
    lastSubmittedPeriod.value = null
    await nextTick()
    getInputEl()?.focus()
  },
)

const toggleCurrency = () => {
  currency.value = currency.value === 'EUR' ? 'USD' : 'EUR'
}

const showConversionNote = computed(() => {
  return (
    data.value
    && lastSubmittedCurrency.value !== 'EUR'
    && lastSubmittedInputAmount.value != null
    && lastSubmittedRate.value != null
  )
})

const conversionNote = computed(() => {
  if (!showConversionNote.value) return null
  const inputFormatted = formatInputCurrency(lastSubmittedInputAmount.value!)
  const periodSuffix = lastSubmittedPeriod.value === 'yearly' ? '/yr' : '/mo'
  const eurFormatted = formatEur(lastSubmittedEurAmount.value!)
  const rateFormatted = lastSubmittedRate.value!.toFixed(4)
  return {
    input: `${inputFormatted}${periodSuffix}`,
    eur: `${eurFormatted}${periodSuffix}`,
    rate: `1 ${lastSubmittedCurrency.value} = ${rateFormatted} EUR`,
    date: exchangeRateDate.value,
  }
})

const formatEur = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

const formatCurrency = formatEur
</script>

<template>
  <div>
    <form @submit.prevent="handleCalculate">
      <UFormField
        :label="amountLabel"
        :ui="{ label: 'text-sm' }"
      >
        <UInput
          ref="inputRef"
          v-model="amount"
          type="number"
          :placeholder="placeholder"
          size="lg"
          class="w-full sm:w-auto"
          :ui="{ trailing: 'pe-1!' }"
          :autofocus="autofocus"
          @blur="hasBlurredOnce = true"
        >
          <template #leading>
            <UTooltip text="Switch input currency. Output is always in EUR.">
              <button
                type="button"
                class="flex items-center cursor-pointer"
                @click="toggleCurrency"
              >
                <UIcon
                  :name="currencyIcon"
                  class="size-5 text-dimmed"
                />
              </button>
            </UTooltip>
          </template>
          <template #trailing>
            <UButton
              color="primary"
              variant="link"
              size="lg"
              icon="mdi:send"
              type="submit"
              :loading="isNonEur && isLoadingRate"
            />
          </template>
        </UInput>
        <p v-if="isNonEur" class="text-xs text-dimmed mt-1">
          Input in {{ currency }} — results will be converted to EUR
        </p>
      </UFormField>
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
    <div v-if="hasSubmittedOnce && isInputValid" class="mt-2 flex items-center gap-2">
      <UTooltip
        v-for="chip in percentChips"
        :key="chip.label"
        :text="chip.tooltip"
      >
        <button
          type="button"
          @click="updateAmountByPercent(chip.delta)"
        >
          <UBadge
            :color="chip.color"
            variant="soft"
            size="sm"
            class="cursor-pointer select-none"
          >
            {{ chip.label }}
          </UBadge>
        </button>
      </UTooltip>
    </div>

    <section v-if="data" class="mt-6 flex flex-col gap-3">
      <div v-if="conversionNote" class="flex items-center gap-2 text-sm text-dimmed bg-elevated rounded-lg px-3 py-2">
        <UIcon name="mdi:swap-horizontal" class="size-4 shrink-0" />
        <span>{{ conversionNote.input }} = {{ conversionNote.eur }} <span class="text-xs">({{ conversionNote.rate }})</span></span>
      </div>

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
