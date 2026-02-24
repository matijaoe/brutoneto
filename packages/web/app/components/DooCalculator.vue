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
const useMinimumSalary = useStorage<boolean>('doo-use-minimum', true)

const revenueNumber = computed(() => Number(revenue.value))
const directorGrossNumber = computed(() =>
  useMinimumSalary.value ? DIRECTOR_MINIMUM_GROSS : Number(directorGross.value),
)

const revenueLabel = computed(() => {
  const periodLabel = period.value === 'yearly' ? 'Yearly' : 'Monthly'
  return `${periodLabel} total revenue`
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

const effectiveSalaryGross = computed(() =>
  useMinimumSalary.value ? null : directorGrossNumber.value || null,
)

const { data, execute: calculate } = useFetch<DooResponse>(
  () => `/api/doo/${revenue.value}`,
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
  if (!useMinimumSalary.value) {
    if (!directorGross.value || directorGrossNumber.value <= 0) return false
  }
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

        <div>
          <div class="flex items-center gap-2 mb-1">
            <label class="text-sm text-muted">Director's gross salary (bruto 1)</label>
          </div>
          <div class="flex items-center gap-3">
            <UInput
              v-model="directorGross"
              icon="mdi:currency-eur"
              type="number"
              :placeholder="String(DIRECTOR_MINIMUM_GROSS)"
              size="lg"
              class="w-full sm:w-auto"
              :disabled="useMinimumSalary"
            />
            <UTooltip text="Use minimum director salary (direktorski minimalac, €1,295.45)">
              <label class="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                <input
                  v-model="useMinimumSalary"
                  type="checkbox"
                  class="accent-primary"
                >
                <span class="text-sm text-muted">Minimalac</span>
              </label>
            </UTooltip>
          </div>
        </div>
      </div>
    </form>

    <section v-if="data" class="mt-6 flex flex-col gap-3">
      <div class="grid md:grid-cols-3 gap-3">
        <UCard>
          <template #header>
            <h2 class="text-base font-bold uppercase font-unifontex text-foreground">
              Net Salary
            </h2>
            <div class="flex flex-col gap-2">
              <p class="text-4xl font-unifontex flex items-baseline gap-2">
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
              <p class="text-4xl font-unifontex flex items-baseline gap-2">
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
