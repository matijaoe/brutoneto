import type { Place } from '@brutoneto/core'
import { roundEuros } from '@brutoneto/core'
import { useSessionStorage } from '@vueuse/core'
import type { BrutoType, Period, SalaryData, SalaryMode } from '~/types'
import type { CurrencySubmission } from './useCurrency'

export function useSalaryCalculation(opts: {
  mode: Ref<SalaryMode>
  brutoType: Ref<BrutoType>
  selectedPlaceKey: Ref<Place>
  period: Ref<Period>
  taxReturnPercent: Ref<number>
}) {
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

  const amount = useSessionStorage<string>('salary-amount', '')
  const amountNumber = computed(() => Number(amount.value))
  const submission = ref<CurrencySubmission | null>(null)
  const hasBlurredOnce = ref(false)
  const markBlurred = () => { hasBlurredOnce.value = true }
  const hasSubmittedOnce = computed(() => submission.value != null)

  const endpoint = computed(() => {
    if (opts.mode.value === 'gross-to-net' && opts.brutoType.value === 'bruto2') return 'neto/bruto2'
    if (opts.mode.value === 'net-to-gross') return 'bruto'
    return 'neto'
  })

  const amountLabel = computed(() => {
    const periodLabel = opts.period.value === 'yearly' ? 'Yearly' : 'Monthly'
    if (opts.mode.value === 'gross-to-net') {
      return opts.brutoType.value === 'bruto2'
        ? `${periodLabel} gross 2 amount (total employer cost)`
        : `${periodLabel} gross amount`
    }
    return `${periodLabel} net amount`
  })

  const { data, error, execute: calculate } = useFetch<SalaryData>(
    () => `/api/${endpoint.value}/${submission.value?.eurAmount ?? 0}`,
    {
      method: 'GET',
      query: {
        detailed: true,
        yearly: computed(() => (opts.period.value === 'yearly' ? 'true' : null)),
        place: opts.selectedPlaceKey,
      },
      immediate: false,
      watch: false,
      lazy: true,
    },
  )

  const taxReturnAmount = computed(() => {
    if (!data.value?.taxes?.total || !opts.taxReturnPercent.value) return 0
    return roundEuros(data.value.taxes.total * opts.taxReturnPercent.value / 100)
  })

  const netWithTaxReturn = computed(() => {
    if (!data.value) return 0
    return roundEuros(data.value.net + taxReturnAmount.value)
  })

  const isInputValid = computed(() => {
    return amount.value !== '' && Number(amount.value) > 0
  })

  const showPeriodHint = computed(() => {
    if (!Number.isFinite(amountNumber.value)) return null
    if (opts.period.value === 'yearly' && amountNumber.value > 0 && amountNumber.value < 10000) {
      if (!hasBlurredOnce.value && !hasSubmittedOnce.value) return null
      return { text: 'Switch to monthly?', next: 'monthly' as const }
    }
    if (opts.period.value === 'monthly' && amountNumber.value >= 20000) {
      return { text: 'Switch to yearly?', next: 'yearly' as const }
    }
    return null
  })

  const conversionNote = computed(() => buildConversionNote(submission.value, !!data.value))

  const percentChips = [
    { label: '-5%', delta: -0.05, tooltip: 'Subtract 5%', color: 'error' },
    { label: '+5%', delta: 0.05, tooltip: 'Add 5%', color: 'success' },
    { label: '+10%', delta: 0.1, tooltip: 'Add 10%', color: 'success' },
    { label: '+15%', delta: 0.15, tooltip: 'Add 15%', color: 'success' },
  ] as const

  const handleCalculate = () => {
    if (!isInputValid.value) return

    const eurAmount = convertToEur(amountNumber.value)
    if (eurAmount == null && isNonEur.value) return

    submission.value = {
      eurAmount: eurAmount ?? amountNumber.value,
      inputAmount: amountNumber.value,
      currency: currency.value,
      period: opts.period.value,
      rate: exchangeRate.value,
    }

    calculate()
  }

  const updateAmountByPercent = (delta: number) => {
    if (!Number.isFinite(amountNumber.value)) return
    const nextValue = roundEuros(amountNumber.value * (1 + delta))
    amount.value = String(nextValue)
    handleCalculate()
  }

  // Re-calculate when place or brutoType changes
  watch(
    [() => opts.selectedPlaceKey.value, () => opts.brutoType.value],
    () => {
      if (!hasSubmittedOnce.value || !isInputValid.value) return
      handleCalculate()
    },
  )

  // Clear data when mode changes
  watch(
    () => opts.mode.value,
    () => {
      data.value = undefined
      submission.value = null
    },
  )

  return {
    // State
    amount,
    data,
    error,
    submission,
    hasSubmittedOnce,

    // Currency
    currency,
    isNonEur,
    isLoadingRate,
    toggleCurrency,
    currencyIcon,

    // Computed
    amountLabel,
    taxReturnAmount,
    netWithTaxReturn,
    isInputValid,
    showPeriodHint,
    conversionNote,
    percentChips,

    // Methods
    handleCalculate,
    updateAmountByPercent,
    markBlurred,
  }
}
