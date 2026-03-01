import { useSessionStorage } from '@vueuse/core'

export type InputCurrency = 'EUR' | 'USD'

export interface CurrencySubmission {
  eurAmount: number
  inputAmount: number
  currency: InputCurrency
  period: 'yearly' | 'monthly'
  rate: number | null
}

interface ExchangeRateResponse {
  from: string
  to: string
  rate: number
  date: string
  stale?: boolean
}

const eurFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' })

export function formatEur(value: number): string {
  return eurFormatter.format(value)
}

export function toYearly(value: number): number {
  return value * 12
}

export function useCurrency() {
  const currency = useSessionStorage<InputCurrency>('input-currency', 'EUR')

  const { data: rateData, status: rateStatus, execute: fetchRate } = useFetch<ExchangeRateResponse>(
    '/api/exchange-rate',
    {
      immediate: false,
      watch: false,
      lazy: true,
    },
  )

  const exchangeRate = computed(() => rateData.value?.rate ?? null)
  const isLoadingRate = computed(() => rateStatus.value === 'pending')
  const isNonEur = computed(() => currency.value !== 'EUR')

  // Fetch rate when USD is selected
  watch(currency, (val) => {
    if (val === 'USD' && !rateData.value) {
      fetchRate()
    }
  }, { immediate: true })

  function convertToEur(amount: number): number | null {
    if (currency.value === 'EUR') return amount
    if (!exchangeRate.value) return null
    return Math.round(amount * exchangeRate.value * 100) / 100
  }

  function formatInputCurrency(value: number, overrideCurrency?: InputCurrency): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: overrideCurrency ?? currency.value,
    }).format(value)
  }

  function toggleCurrency() {
    currency.value = currency.value === 'EUR' ? 'USD' : 'EUR'
  }

  function buildConversionNote(submission: CurrencySubmission | null, hasData: boolean) {
    if (!hasData || !submission || submission.currency === 'EUR' || submission.rate == null) return null
    const periodSuffix = submission.period === 'yearly' ? '/yr' : '/mo'
    return {
      input: `${formatInputCurrency(submission.inputAmount, submission.currency)}${periodSuffix}`,
      eur: `${formatEur(submission.eurAmount)}${periodSuffix}`,
      rate: `1 ${submission.currency} = ${submission.rate.toFixed(4)} EUR`,
    }
  }

  const currencyIcon = computed(() => {
    return currency.value === 'USD' ? 'mdi:currency-usd' : 'mdi:currency-eur'
  })

  return {
    currency,
    exchangeRate,
    isLoadingRate,
    isNonEur,
    convertToEur,
    formatInputCurrency,
    toggleCurrency,
    buildConversionNote,
    currencyIcon,
  }
}
