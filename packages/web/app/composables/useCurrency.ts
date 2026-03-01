import { roundEuros } from '@brutoneto/core'
import { useSessionStorage } from '@vueuse/core'
import { formatEur } from '~/utils/formatters'

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
    return roundEuros(amount * exchangeRate.value)
  }

  const formatterCache = new Map<string, Intl.NumberFormat>()
  function formatInputCurrency(value: number, overrideCurrency?: InputCurrency): string {
    const key = overrideCurrency ?? currency.value
    let fmt = formatterCache.get(key)
    if (!fmt) {
      fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: key })
      formatterCache.set(key, fmt)
    }
    return fmt.format(value)
  }

  function toggleCurrency() {
    currency.value = currency.value === 'EUR' ? 'USD' : 'EUR'
  }

  function buildConversionNote(submission: CurrencySubmission | null, hasData: boolean) {
    if (!hasData || !submission || submission.currency === 'EUR' || submission.rate == null) return null
    const periodSuffix = submission.period === 'yearly' ? '/yr' : '/mo'
    const monthlyEur = submission.period === 'yearly'
      ? formatEur(submission.eurAmount / 12)
      : null
    return {
      input: `${formatInputCurrency(submission.inputAmount, submission.currency)}${periodSuffix}`,
      eur: `${formatEur(submission.eurAmount)}${periodSuffix}`,
      monthlyEur: monthlyEur ? `${monthlyEur}/mo` : null,
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
    toggleCurrency,
    buildConversionNote,
    currencyIcon,
  }
}
