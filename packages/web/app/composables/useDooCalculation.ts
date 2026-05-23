import type { DooBreakdown, NonTaxableBenefitsBreakdown, Place } from '@brutoneto/core'
import { DIRECTOR_MINIMUM_GROSS, roundEuros } from '@brutoneto/core'
import { useSessionStorage } from '@vueuse/core'
import type { Period } from '~/types'
import type { CurrencySubmission } from './useCurrency'

export function useDooCalculation(opts: {
  selectedPlaceKey: Ref<Place>
  period: Ref<Period>
  taxReturnPercent: Ref<number>
  benefits: Ref<NonTaxableBenefitsBreakdown>
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

  const revenue = useSessionStorage<string>('doo-revenue', '')
  const directorGross = useSessionStorage<string>('doo-director-gross', String(DIRECTOR_MINIMUM_GROSS))
  const dividendPercentage = useSessionStorage<string>('doo-dividend-percent', '100')

  const revenueNumber = computed(() => Number(revenue.value))
  const directorGrossNumber = computed(() => Number(directorGross.value))
  const dividendPercentageNumber = computed(() => Number(dividendPercentage.value))

  const isAtMinimum = computed(() => directorGrossNumber.value === DIRECTOR_MINIMUM_GROSS)

  const setMinimumSalary = () => {
    directorGross.value = String(DIRECTOR_MINIMUM_GROSS)
  }

  const revenueLabel = computed(() => {
    const periodLabel = opts.period.value === 'yearly' ? 'Yearly' : 'Monthly'
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
  const hasSubmittedOnce = computed(() => submission.value != null)

  const { data, error, execute: calculate } = useFetch<DooBreakdown>(
    () => `/api/doo/${submission.value?.eurAmount ?? 0}`,
    {
      method: 'GET',
      query: {
        detailed: true,
        yearly: computed(() => (opts.period.value === 'yearly' ? 'true' : null)),
        place: opts.selectedPlaceKey,
        salary_gross: effectiveSalaryGross,
      },
      immediate: false,
      watch: false,
      lazy: true,
    },
  )

  // Note: benefits are deliberately NOT included in the API request — they're
  // applied client-side in `adjustedDividend` for instant updates, identical to
  // how `dividendPercentage` is handled.

  const isInputValid = computed(() => {
    if (!revenue.value || revenueNumber.value <= 0) return false
    if (directorGrossError.value) return false
    if (!directorGross.value || directorGrossNumber.value <= 0) return false
    if (dividendPercentageError.value) return false
    return true
  })

  const handleCalculate = () => {
    if (!isInputValid.value) return

    const eurAmount = convertToEur(revenueNumber.value)
    if (eurAmount == null && isNonEur.value) return

    submission.value = {
      eurAmount: eurAmount ?? revenueNumber.value,
      inputAmount: revenueNumber.value,
      currency: currency.value,
      period: opts.period.value,
      rate: exchangeRate.value,
    }

    calculate()
  }

  watch(
    () => opts.selectedPlaceKey.value,
    () => {
      if (!hasSubmittedOnce.value || !isInputValid.value) return
      handleCalculate()
    },
  )

  // Apply dividend %, tax return, AND non-taxable benefits client-side for instant updates.
  // Benefits reduce profit dollar-for-dollar (and therefore corp tax + dividend),
  // and split into cash (employee bank) vs asset (insurance/pension) destinations.
  const adjustedDividend = computed(() => {
    if (!data.value) return null
    const { corporateTaxRate } = data.value.corporate
    const { dividendTaxRate } = data.value.dividend
    const { netSalary } = data.value.totals

    // Reverse-engineer the base (pre-benefit) profit so this stays correct
    // even if the API returned benefits already applied.
    const baseProfit = roundEuros(
      data.value.corporate.profit + (data.value.benefits?.totalMonthly ?? 0),
    )

    const benefitsTotal = opts.benefits.value.totalMonthly
    const profit = Math.max(0, roundEuros(baseProfit - benefitsTotal))
    const corporateTax = roundEuros(profit * corporateTaxRate)
    const profitAfterTax = roundEuros(profit - corporateTax)

    const pct = Math.max(0, Math.min(100, dividendPercentageNumber.value)) / 100
    const grossDividend = roundEuros(profitAfterTax * pct)
    const dividendTax = roundEuros(grossDividend * dividendTaxRate)
    const netDividend = roundEuros(grossDividend - dividendTax)
    const retained = roundEuros(profitAfterTax - grossDividend)
    const monthlyNet = roundEuros(netSalary + netDividend)

    const taxReturn = roundEuros(data.value.salary.taxes.total * opts.taxReturnPercent.value / 100)
    const monthlyNetWithTaxReturn = roundEuros(monthlyNet + taxReturn)
    const totalWithRetained = roundEuros(monthlyNet + retained)

    const cashBenefits = opts.benefits.value.cashMonthly
    const assetBenefits = opts.benefits.value.assetMonthly
    const cashInHand = roundEuros(netSalary + netDividend + cashBenefits)
    const assets = roundEuros(retained + assetBenefits)
    const totalValue = roundEuros(cashInHand + assets)

    // 1 − (1 − corp)(1 − div) → ~20.8% for default 10% / 12%
    const dividendRouteFactor = 1 - (1 - corporateTaxRate) * (1 - dividendTaxRate)
    const savingsVsDividend = roundEuros(opts.benefits.value.totalMonthly * dividendRouteFactor)

    return {
      grossDividend,
      dividendTax,
      netDividend,
      retained,
      monthlyNet,
      taxReturn,
      monthlyNetWithTaxReturn,
      totalWithRetained,
      profit,
      corporateTax,
      profitAfterTax,
      cashBenefits,
      assetBenefits,
      cashInHand,
      assets,
      totalValue,
      savingsVsDividend,
    }
  })

  const conversionNote = computed(() => buildConversionNote(submission.value, !!data.value))

  return {
    // State
    revenue,
    directorGross,
    dividendPercentage,
    data,
    error,

    // Currency
    currency,
    isNonEur,
    isLoadingRate,
    toggleCurrency,
    currencyIcon,

    // Computed
    revenueLabel,
    directorGrossError,
    dividendPercentageError,
    isAtMinimum,
    adjustedDividend,
    isInputValid,
    conversionNote,

    // Methods
    handleCalculate,
    setMinimumSalary,
  }
}
