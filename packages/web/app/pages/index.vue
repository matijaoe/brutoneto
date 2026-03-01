<script setup lang="ts">
import type { Place } from '@brutoneto/core'
import { useLocalStorage } from '@vueuse/core'
import type { BrutoType, Mode, Period } from '~/types'

// --- Route & state management ---
const route = useRoute()
const router = useRouter()

function replaceQuery(updates: Record<string, string | undefined>) {
  const query = { ...route.query }
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete query[key]
    }
    else {
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

const brutoType = computed<BrutoType>({
  get: () => (route.query.bruto === '2' ? 'bruto2' : 'bruto1'),
  set: (value) => {
    replaceQuery({ bruto: value === 'bruto2' ? '2' : undefined })
  },
})

const selectedPlaceKey = useCookie<Place>('place', {
  default: () => 'sveta-nedelja-samobor',
})

const periodCookie = useCookie<Period>('period', {
  default: () => 'monthly',
})

const period = computed<Period>({
  get: () => (route.query.period === 'yr' ? 'yearly' : periodCookie.value),
  set: (value) => {
    periodCookie.value = value
    replaceQuery({ period: value === 'yearly' ? 'yr' : undefined })
  },
})

const taxReturnPercent = useLocalStorage<number>('tax-return-percent', 0)

// --- Places data ---
const { data: taxesRes, status: taxesStatus } = useFetch<{ places: {
  key: Place
  name: string
  taxRateLow: number
  taxRateHigh: number
}[] }>('/api/taxes', {
  method: 'GET',
})
const places = computed(() => taxesRes.value?.places)
const selectedPlaceName = computed(() => {
  const place = places.value?.find(p => p.key === selectedPlaceKey.value)
  return place?.name
})

// --- Salary calculation ---
const salaryMode = computed(() => mode.value === 'net-to-gross' ? 'net-to-gross' as const : 'gross-to-net' as const)
const salary = useSalaryCalculation({
  mode: salaryMode,
  brutoType,
  selectedPlaceKey: selectedPlaceKey as Ref<Place>,
  period,
  taxReturnPercent,
})

// --- D.O.O. calculation ---
const doo = useDooCalculation({
  selectedPlaceKey: selectedPlaceKey as Ref<Place>,
  period,
  taxReturnPercent,
})

// Focus input on mode change
const amountInputRef = ref<{ blurInput: () => void, focusInput: () => void } | null>(null)
watch(mode, async () => {
  await nextTick()
  amountInputRef.value?.focusInput()
})

// Salary placeholder
const salaryPlaceholder = computed(() => {
  if (mode.value === 'net-to-gross') return '2200'
  return brutoType.value === 'bruto2' ? '4660' : '3000'
})

// Period hint handler
const handlePeriodHint = () => {
  if (salary.showPeriodHint.value) {
    period.value = salary.showPeriodHint.value.next
  }
}

// Mode tabs
const modeTabs: Array<{ label: string, value: Mode }> = [
  { label: 'Gross \u2192 Net', value: 'gross-to-net' },
  { label: 'Net \u2192 Gross', value: 'net-to-gross' },
  { label: 'D.O.O.', value: 'doo' },
]
</script>

<template>
  <div>
    <!-- Top header bar -->
    <header class="flex items-center gap-3 sm:gap-5 mb-6">
      <h1 class="text-2xl font-bold font-unifontex uppercase shrink-0">
        Bruto<span class="text-primary italic">neto</span>
      </h1>

      <nav role="tablist" class="flex items-center flex-wrap" aria-label="Calculator mode">
        <button
          v-for="tab in modeTabs"
          :key="tab.value"
          role="tab"
          type="button"
          :aria-selected="mode === tab.value"
          class="px-2 sm:px-3 py-1 text-xs sm:text-sm font-unifontex uppercase tracking-wide cursor-pointer transition-colors whitespace-nowrap"
          :class="[
            mode === tab.value
              ? 'text-primary font-bold'
              : 'text-muted hover:text-foreground',
          ]"
          @click="mode = tab.value"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <!-- Two-column layout -->
    <div class="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <!-- Input Panel -->
      <LayoutInputPanel>
        <div class="flex flex-col gap-5">
          <InputModeHeader :mode="mode" />

          <!-- Salary inputs -->
          <template v-if="mode !== 'doo'">
            <div class="flex flex-col gap-1.5">
              <InputAmountInput
                ref="amountInputRef"
                v-model="salary.amount.value"
                :label="salary.amountLabel.value"
                :placeholder="salaryPlaceholder"
                :currency-icon="salary.currencyIcon.value"
                :is-non-eur="salary.isNonEur.value"
                :currency="salary.currency.value"
                :is-loading="salary.isNonEur.value && salary.isLoadingRate.value"
                autofocus
                @submit="salary.handleCalculate"
                @toggle-currency="salary.toggleCurrency"
                @blur="salary.markBlurred"
              />

              <Transition
                enter-active-class="transition duration-200"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <UButton
                  v-if="salary.showPeriodHint.value"
                  variant="link"
                  size="xs"
                  color="neutral"
                  class="px-0"
                  @click="handlePeriodHint"
                >
                  {{ salary.showPeriodHint.value.text }}
                </UButton>
              </Transition>

              <InputQuickChips
                v-if="salary.hasSubmittedOnce.value && salary.isInputValid.value"
                :chips="salary.percentChips"
                @adjust="salary.updateAmountByPercent"
              />
            </div>
          </template>

          <!-- D.O.O. inputs -->
          <template v-else>
            <InputAmountInput
              ref="amountInputRef"
              v-model="doo.revenue.value"
              :label="doo.revenueLabel.value"
              placeholder="5000"
              :currency-icon="doo.currencyIcon.value"
              :is-non-eur="doo.isNonEur.value"
              :currency="doo.currency.value"
              :is-loading="doo.isNonEur.value && doo.isLoadingRate.value"
              autofocus
              @submit="doo.handleCalculate"
              @toggle-currency="doo.toggleCurrency"
            />

            <InputDooDistributionControls
              :director-gross="doo.directorGross.value"
              :dividend-percentage="doo.dividendPercentage.value"
              :director-gross-error="doo.directorGrossError.value"
              :dividend-percentage-error="doo.dividendPercentageError.value"
              :is-at-minimum="doo.isAtMinimum.value"
              @update:director-gross="doo.directorGross.value = $event"
              @update:dividend-percentage="doo.dividendPercentage.value = $event"
              @set-minimum-salary="doo.setMinimumSalary"
            />
          </template>

          <!-- Calculation params -->
          <InputCalculationParams
            :period="period"
            :selected-place-key="selectedPlaceKey"
            :bruto-type="brutoType"
            :tax-return-percent="taxReturnPercent"
            :mode="mode"
            :places="places"
            :places-loading="taxesStatus === 'pending'"
            @update:period="period = $event"
            @update:selected-place-key="selectedPlaceKey = $event"
            @update:bruto-type="brutoType = $event"
            @update:tax-return-percent="taxReturnPercent = $event"
          />

          <!-- Input summary -->
          <InputInputSummary
            v-if="(mode !== 'doo' && salary.data.value) || (mode === 'doo' && doo.data.value && doo.adjustedDividend.value)"
            :mode="mode"
            :salary-data="salary.data.value"
            :doo-data="doo.data.value"
            :adjusted-dividend="doo.adjustedDividend.value"
            :period="period"
          />
        </div>
      </LayoutInputPanel>

      <!-- Results Panel -->
      <LayoutResultsPanel
        :has-data="mode !== 'doo' ? !!salary.data.value : !!(doo.data.value && doo.adjustedDividend.value)"
        :error="mode !== 'doo' ? salary.error.value?.message : doo.error.value?.message"
      >
        <ResultsSalaryResults
          v-if="mode !== 'doo' && salary.data.value"
          :data="salary.data.value"
          :mode="salaryMode"
          :tax-return-amount="salary.taxReturnAmount.value"
          :net-with-tax-return="salary.netWithTaxReturn.value"
          :conversion-note="salary.conversionNote.value"
          :place-name="selectedPlaceName"
        />

        <ResultsDooResults
          v-if="mode === 'doo' && doo.data.value && doo.adjustedDividend.value"
          :data="doo.data.value"
          :adjusted-dividend="doo.adjustedDividend.value"
          :conversion-note="doo.conversionNote.value"
          :place-name="selectedPlaceName"
        />
      </LayoutResultsPanel>
    </div>
  </div>
</template>
