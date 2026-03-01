<script setup lang="ts">
import type { DooBreakdown, Place } from '@brutoneto/core'
import { DIRECTOR_MINIMUM_GROSS, roundEuros } from '@brutoneto/core'
import { useClipboard, useSessionStorage } from '@vueuse/core'
import { formatEur, toYearly } from '~/composables/useCurrency'

type Props = {
  selectedPlaceKey: Place
  period: 'yearly' | 'monthly'
  taxReturnPercent: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (event: 'update:period', value: 'yearly' | 'monthly'): void
}>()

const {
  currency,
  exchangeRate,
  isLoadingRate,
  isNonEur,
  convertToEur,
  toggleCurrency,
  buildConversionNote,
  currencyIcon,
} = useCurrency()

const selectedPlaceKey = toRef(props, 'selectedPlaceKey')
const period = computed({
  get: () => props.period,
  set: (value: 'yearly' | 'monthly') => emit('update:period', value),
})

const revenue = useSessionStorage<string>('doo-revenue', '')
const directorGross = useSessionStorage<string>('doo-director-gross', String(DIRECTOR_MINIMUM_GROSS))
const dividendPercentage = useSessionStorage<string>('doo-dividend-percent', '100')

const revenueNumber = computed(() => Number(revenue.value))
const directorGrossNumber = computed(() => Number(directorGross.value))
const dividendPercentageNumber = computed(() => Number(dividendPercentage.value))

const isAtMinimum = computed(() => directorGrossNumber.value === DIRECTOR_MINIMUM_GROSS)
const isFullDividend = computed(() => dividendPercentageNumber.value === 100)

const setMinimumSalary = () => {
  directorGross.value = String(DIRECTOR_MINIMUM_GROSS)
}

const setFullDividend = () => {
  dividendPercentage.value = '100'
}

const revenueLabel = computed(() => {
  const periodLabel = period.value === 'yearly' ? 'Yearly' : 'Monthly'
  return `${periodLabel} total revenue`
})

const directorGrossError = computed(() => {
  if (!directorGross.value) return undefined
  const value = directorGrossNumber.value
  if (value > 0 && value < DIRECTOR_MINIMUM_GROSS) {
    return `Minimum is €${DIRECTOR_MINIMUM_GROSS} (director's minimum wage)`
  }
  return undefined
})

const dividendPercentageError = computed(() => {
  if (!dividendPercentage.value) return undefined
  const value = dividendPercentageNumber.value
  if (value < 0 || value > 100) {
    return 'Must be between 0 and 100'
  }
  return undefined
})

const effectiveSalaryGross = computed(() => directorGrossNumber.value || null)

const submission = ref<CurrencySubmission | null>(null)

const { data, execute: calculate } = useFetch<DooBreakdown>(
  () => `/api/doo/${submission.value?.eurAmount ?? 0}`,
  {
    method: 'GET',
    query: {
      detailed: true,
      yearly: computed(() => (period.value === 'yearly' ? 'true' : null)),
      place: selectedPlaceKey,
      salary_gross: effectiveSalaryGross,
    },
    immediate: false,
    watch: false,
    lazy: true,
  },
)

const isInputValid = computed(() => {
  if (!revenue.value || revenueNumber.value <= 0) return false
  if (directorGrossError.value) return false
  if (!directorGross.value || directorGrossNumber.value <= 0) return false
  if (dividendPercentageError.value) return false
  return true
})

const hasSubmittedOnce = computed(() => submission.value != null)
const revenueInputRef = ref<any>(null)
const getRevenueInputEl = () =>
  (revenueInputRef.value?.$el as HTMLElement | undefined)?.querySelector?.('input') as HTMLInputElement | null

const handleCalculate = () => {
  if (!isInputValid.value) return

  const eurAmount = convertToEur(revenueNumber.value)
  if (eurAmount == null && isNonEur.value) return

  submission.value = {
    eurAmount: eurAmount ?? revenueNumber.value,
    inputAmount: revenueNumber.value,
    currency: currency.value,
    period: period.value,
    rate: exchangeRate.value,
  }

  calculate()
  getRevenueInputEl()?.blur()
}

watch(
  () => selectedPlaceKey.value,
  () => {
    if (!hasSubmittedOnce.value || !isInputValid.value) return
    handleCalculate()
  },
)

// Apply dividend percentage and tax return client-side for instant updates
const adjustedDividend = computed(() => {
  if (!data.value) return null
  const { profitAfterTax } = data.value.corporate
  const { dividendTaxRate } = data.value.dividend
  const { netSalary } = data.value.totals

  const pct = dividendPercentageNumber.value / 100
  const grossDividend = roundEuros(profitAfterTax * pct)
  const dividendTax = roundEuros(grossDividend * dividendTaxRate)
  const netDividend = roundEuros(grossDividend - dividendTax)
  const retained = roundEuros(profitAfterTax - grossDividend)
  const monthlyNet = roundEuros(netSalary + netDividend)

  const taxReturn = roundEuros(data.value.salary.taxes.total * props.taxReturnPercent / 100)
  const monthlyNetWithTaxReturn = roundEuros(monthlyNet + taxReturn)
  const totalWithRetained = roundEuros(monthlyNet + retained)

  return { netDividend, retained, monthlyNet, taxReturn, monthlyNetWithTaxReturn, totalWithRetained }
})

const formattedData = computed(() =>
  data.value ? JSON.stringify(data.value, null, 2) : '',
)
const { copy, copied } = useClipboard({ copiedDuring: 1200 })

const conversionNote = computed(() => buildConversionNote(submission.value, !!data.value))
</script>

<template>
  <div>
    <form @submit.prevent="handleCalculate">
      <div class="flex flex-col gap-3">
        <UFormField
          :label="revenueLabel"
          :ui="{ label: 'text-sm' }"
        >
          <UInput
            ref="revenueInputRef"
            v-model="revenue"
            type="number"
            placeholder="5000"
            size="lg"
            class="w-full sm:w-auto"
            :ui="{ trailing: 'pe-1!' }"
            autofocus
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

        <UFormField
          label="Director's gross salary (bruto 1)"
          :error="directorGrossError"
          :ui="{ label: 'text-sm' }"
        >
          <div class="flex items-center gap-2">
            <UInput
              v-model="directorGross"
              icon="mdi:currency-eur"
              type="number"
              :placeholder="String(DIRECTOR_MINIMUM_GROSS)"
              size="lg"
              class="w-full sm:w-auto"
              :color="directorGrossError ? 'error' : undefined"
            />
            <UTooltip text="Set to director's minimum wage (€1,295.45)">
              <UButton
                label="Use minimum"
                color="neutral"
                :variant="isAtMinimum ? 'soft' : 'outline'"
                size="lg"
                :disabled="isAtMinimum"
                @click="setMinimumSalary"
              />
            </UTooltip>
          </div>
        </UFormField>

        <UFormField
          label="Dividend withdrawal %"
          :error="dividendPercentageError"
          :ui="{ label: 'text-sm' }"
        >
          <div class="flex items-center gap-2">
            <UInput
              v-model="dividendPercentage"
              icon="mdi:percent"
              type="number"
              placeholder="100"
              :min="0"
              :max="100"
              size="lg"
              class="w-full sm:w-auto"
              :color="dividendPercentageError ? 'error' : undefined"
            />
            <UTooltip text="Withdraw 100% of profit after corporate tax">
              <UButton
                label="Use 100%"
                color="neutral"
                :variant="isFullDividend ? 'soft' : 'outline'"
                size="lg"
                :disabled="isFullDividend"
                @click="setFullDividend"
              />
            </UTooltip>
          </div>
        </UFormField>
      </div>
    </form>

    <section v-if="data" class="mt-6 flex flex-col gap-3">
      <div v-if="conversionNote" class="flex items-center gap-2 text-sm text-dimmed bg-elevated rounded-lg px-3 py-2">
        <UIcon name="mdi:swap-horizontal" class="size-4 shrink-0" />
        <span>{{ conversionNote.input }} = {{ conversionNote.eur }} <span class="text-xs">({{ conversionNote.rate }})</span></span>
      </div>

      <div class="grid md:grid-cols-2 gap-3">
        <UCard>
          <template #header>
            <h2 class="text-base font-bold uppercase font-unifontex text-foreground">
              Net Salary
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                <span class="text-foreground">
                  {{ formatEur(data.totals.netSalary) }}
                </span>
                <span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatEur(toYearly(data.totals.netSalary)) }} /yr
              </p>
            </div>
          </template>
        </UCard>
        <UCard>
          <template #header>
            <h2 class="text-base font-bold uppercase font-unifontex text-foreground">
              Dividend
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                <span class="text-foreground">
                  {{ formatEur(adjustedDividend?.netDividend ?? data.totals.netDividend) }}
                </span>
                <span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatEur(toYearly(adjustedDividend?.netDividend ?? data.totals.netDividend)) }} /yr
              </p>
            </div>
          </template>
        </UCard>
      </div>

      <div class="grid gap-3" :class="adjustedDividend && adjustedDividend.retained > 0 ? 'md:grid-cols-2' : ''">
        <UCard>
          <template #header>
            <h2 class="text-base font-bold uppercase font-unifontex text-primary">
              Total
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                <span class="text-foreground">
                  {{ formatEur(adjustedDividend?.monthlyNet ?? data.totals.monthlyNet) }}
                </span>
                <span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatEur(toYearly(adjustedDividend?.monthlyNet ?? data.totals.monthlyNet)) }} /yr
              </p>
              <p v-if="adjustedDividend && adjustedDividend.taxReturn > 0" class="text-sm text-muted font-unifontex">
                with tax return: {{ formatEur(adjustedDividend.monthlyNetWithTaxReturn) }} /mo
              </p>
              <p v-if="adjustedDividend && adjustedDividend.retained > 0" class="text-sm text-muted font-unifontex">
                incl. company balance: {{ formatEur(adjustedDividend.totalWithRetained) }} /mo
              </p>
            </div>
          </template>
        </UCard>

        <UCard v-if="adjustedDividend && adjustedDividend.retained > 0" variant="subtle">
          <template #header>
            <h2 class="text-base font-bold uppercase font-unifontex text-muted">
              Company balance
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                <span class="text-foreground">
                  {{ formatEur(adjustedDividend.retained) }}
                </span>
                <span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatEur(toYearly(adjustedDividend.retained)) }} /yr
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
