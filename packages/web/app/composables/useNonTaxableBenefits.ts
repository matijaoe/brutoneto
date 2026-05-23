import type { MealMode, NonTaxableBenefitsBreakdown, NonTaxableBenefitsConfig } from '@brutoneto/core'
import { calculateNonTaxableBenefits } from '@brutoneto/core'
import { useSessionStorage } from '@vueuse/core'

/**
 * Tracks toggle state for the non-taxable benefits panel in the D.O.O. calculator
 * and computes the resulting breakdown client-side via @brutoneto/core.
 */
export function useNonTaxableBenefits() {
  const prigodneNagrade = useSessionStorage<boolean>('doo-benefit-nagrade', false)
  const nagradaZaRezultate = useSessionStorage<boolean>('doo-benefit-results', false)
  const prehrana = useSessionStorage<MealMode>('doo-benefit-meal', 'off')
  const radOdKuce = useSessionStorage<boolean>('doo-benefit-remote', false)
  const odmorRadnika = useSessionStorage<boolean>('doo-benefit-vacation', false)
  const dopunskoZdravstveno = useSessionStorage<boolean>('doo-benefit-health', false)
  const treciStup = useSessionStorage<boolean>('doo-benefit-pension', false)

  const config = computed<NonTaxableBenefitsConfig>(() => ({
    prigodneNagrade: prigodneNagrade.value,
    nagradaZaRezultate: nagradaZaRezultate.value,
    prehrana: prehrana.value,
    radOdKuce: radOdKuce.value,
    odmorRadnika: odmorRadnika.value,
    dopunskoZdravstveno: dopunskoZdravstveno.value,
    treciStup: treciStup.value,
  }))

  const breakdown = computed<NonTaxableBenefitsBreakdown>(() =>
    calculateNonTaxableBenefits(config.value),
  )

  const hasAny = computed(() => breakdown.value.items.length > 0)

  const reset = () => {
    prigodneNagrade.value = false
    nagradaZaRezultate.value = false
    prehrana.value = 'off'
    radOdKuce.value = false
    odmorRadnika.value = false
    dopunskoZdravstveno.value = false
    treciStup.value = false
  }

  return {
    prigodneNagrade,
    nagradaZaRezultate,
    prehrana,
    radOdKuce,
    odmorRadnika,
    dopunskoZdravstveno,
    treciStup,
    config,
    breakdown,
    hasAny,
    reset,
  }
}
