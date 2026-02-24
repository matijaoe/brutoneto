<script setup lang="ts">
import type { Place } from '@brutoneto/core'
import { useClipboard, useStorage } from '@vueuse/core'

const DIRECTOR_MINIMUM_GROSS = 1_295.45

type Props = {
  selectedPlaceKey: Place
  period: 'yearly' | 'monthly'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (event: 'update:period', value: 'yearly' | 'monthly'): void
}>()

const selectedPlaceKey = toRef(props, 'selectedPlaceKey')
const period = computed({
  get: () => props.period,
  set: (value: 'yearly' | 'monthly') => emit('update:period', value),
})

const revenue = useStorage<string>('doo-revenue', '')
const directorGross = useStorage<string>('doo-director-gross', String(DIRECTOR_MINIMUM_GROSS))
const dividendPercentage = useStorage<string>('doo-dividend-pct', '100')

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

interface DooResponse {
  totalRevenue: number
  directorGross: number
  salary: {
    gross: number
    net: number
    totalCostToEmployer: number
    healthInsurance: number
    pension: {
      firstPillar: number
      secondPillar: number
      mandatoryTotal: number
      thirdPillar: number
      total: number
    }
    income: number
    personalAllowance: number
    taxableIncome: number
    taxes: {
      lowerBracket: number
      higherBracket: number
      total: number
      totalHalf: number
    }
  }
  corporate: {
    profit: number
    corporateTaxRate: number
    corporateTax: number
    profitAfterTax: number
    retainedEarnings: number
  }
  dividend: {
    grossDividend: number
    dividendTaxRate: number
    dividendTax: number
    netDividend: number
  }
  totals: {
    netSalary: number
    netDividend: number
    monthlyNet: number
    taxReturn: number
    monthlyNetWithTaxReturn: number
  }
}

const effectiveSalaryGross = computed(() => directorGrossNumber.value || null)
const effectiveDividendPct = computed(() => {
  const val = dividendPercentageNumber.value
  return val >= 0 && val <= 100 ? val : null
})

const { data, execute: calculate } = useFetch<DooResponse>(
  () => `/api/doo/${revenue.value}`,
  {
    method: 'GET',
    query: {
      detailed: true,
      yearly: computed(() => (period.value === 'yearly' ? 'true' : null)),
      place: selectedPlaceKey,
      salary_gross: effectiveSalaryGross,
      dividend_pct: effectiveDividendPct,
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

const hasSubmittedOnce = ref(false)
const revenueInputRef = ref<any>(null)
const getRevenueInputEl = () =>
  (revenueInputRef.value?.$el as HTMLElement | undefined)?.querySelector?.('input') as HTMLInputElement | null

const handleCalculate = () => {
  if (!isInputValid.value) return
  hasSubmittedOnce.value = true
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

watch(
  () => dividendPercentage.value,
  () => {
    if (!hasSubmittedOnce.value || !isInputValid.value) return
    handleCalculate()
  },
)

const toYearly = (value: number) => value * 12

const formattedData = computed(() =>
  data.value ? JSON.stringify(data.value, null, 2) : '',
)
const { copy, copied } = useClipboard({ copiedDuring: 1200 })

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
      <div class="flex flex-col gap-3">
        <UFormField
          :label="revenueLabel"
          :ui="{ label: 'text-sm' }"
        >
          <UInput
            ref="revenueInputRef"
            v-model="revenue"
            icon="mdi:currency-eur"
            type="number"
            placeholder="5000"
            size="lg"
            class="w-full sm:w-auto"
            :ui="{ trailing: 'pe-1!' }"
            autofocus
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
      <div class="grid md:grid-cols-2 gap-3">
        <UCard>
          <template #header>
            <h2 class="text-base font-bold uppercase font-unifontex text-foreground">
              Net Salary
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-5xl font-unifontex flex items-baseline gap-2">
                <span class="text-foreground">
                  {{ formatCurrency(data.totals.netSalary) }}
                </span>
                <span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatCurrency(toYearly(data.totals.netSalary)) }} /yr
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
                  {{ formatCurrency(data.totals.netDividend) }}
                </span>
                <span class="text-base text-muted">/mo</span>
              </p>
              <p class="text-lg text-muted font-unifontex">
                {{ formatCurrency(toYearly(data.totals.netDividend)) }} /yr
              </p>
            </div>
          </template>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-base font-bold uppercase font-unifontex text-primary">
            Total
          </h2>
          <div class="flex flex-col gap-2">
            <p class="text-5xl font-unifontex flex items-baseline gap-2">
              <span class="text-foreground">
                {{ formatCurrency(data.totals.monthlyNet) }}
              </span>
              <span class="text-base text-muted">/mo</span>
            </p>
            <p class="text-lg text-muted font-unifontex">
              {{ formatCurrency(toYearly(data.totals.monthlyNet)) }} /yr
            </p>
            <p v-if="data.totals.taxReturn > 0" class="text-sm text-muted font-unifontex">
              with tax return: {{ formatCurrency(data.totals.monthlyNetWithTaxReturn) }} /mo
            </p>
          </div>
        </template>
      </UCard>

      <UCard v-if="data.corporate.retainedEarnings > 0" variant="subtle">
        <template #header>
          <h2 class="text-base font-bold uppercase font-unifontex text-muted">
            Remains in company
          </h2>
          <div class="flex flex-col gap-2">
            <p class="text-5xl font-unifontex flex items-baseline gap-2">
              <span class="text-foreground">
                {{ formatCurrency(data.corporate.retainedEarnings) }}
              </span>
              <span class="text-base text-muted">/mo</span>
            </p>
            <p class="text-lg text-muted font-unifontex">
              {{ formatCurrency(toYearly(data.corporate.retainedEarnings)) }} /yr
            </p>
          </div>
        </template>
      </UCard>

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
