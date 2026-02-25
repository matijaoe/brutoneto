import { useStorage } from '@vueuse/core'

export type InputCurrency = 'EUR' | 'USD'

interface ExchangeRateResponse {
  from: string
  to: string
  rate: number
  date: string
  stale?: boolean
}

export function useCurrency() {
  const currency = useStorage<InputCurrency>('input-currency', 'EUR')

  const { data: rateData, status: rateStatus, execute: fetchRate } = useFetch<ExchangeRateResponse>(
    '/api/exchange-rate',
    {
      immediate: false,
      watch: false,
      lazy: true,
    },
  )

  const exchangeRate = computed(() => rateData.value?.rate ?? null)
  const exchangeRateDate = computed(() => rateData.value?.date ?? null)
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

  function formatInputCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.value,
    }).format(value)
  }

  const currencyIcon = computed(() => {
    return currency.value === 'USD' ? 'mdi:currency-usd' : 'mdi:currency-eur'
  })

  const currencySymbol = computed(() => {
    return currency.value === 'USD' ? '$' : '€'
  })

  return {
    currency,
    exchangeRate,
    exchangeRateDate,
    isLoadingRate,
    isNonEur,
    convertToEur,
    formatInputCurrency,
    currencyIcon,
    currencySymbol,
    fetchRate,
  }
}
