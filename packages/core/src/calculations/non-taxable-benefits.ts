import { Decimal } from '../lib/decimal'
import { roundEuros } from '../utils/precision'

/**
 * Croatian 2026 non-taxable benefit limits ("neoporezivi primici").
 *
 * Each item the company can pay out to an employee free of income tax and
 * contributions, up to the stated yearly limit. Monthly figures are either
 * 1/12 of the yearly limit, or a hard monthly cap where regulation specifies one.
 *
 * @note neoporezivi primici 2026
 */
export const NON_TAXABLE_BENEFIT_LIMITS_2026 = {
  prigodneNagrade: {
    label: 'Prigodne nagrade',
    description: 'Božićnica + regres + uskrsnica (zbirno)',
    yearly: 700,
    monthly: 58.33,
    category: 'cash',
    requirement: 'Isplata na žiro račun',
  },
  nagradaZaRezultate: {
    label: 'Nagrada za radne rezultate',
    yearly: 1_200,
    monthly: 100,
    category: 'cash',
    requirement: 'Isplata na žiro račun',
  },
  prehranaPausal: {
    label: 'Prehrana — paušal',
    yearly: 1_200,
    monthly: 100,
    category: 'cash',
    requirement: 'Isplata na žiro račun',
  },
  prehranaRacuni: {
    label: 'Prehrana — po računima',
    yearly: 1_800,
    monthly: 150,
    category: 'cash',
    requirement: 'Bezgotovinski, računi izdani na firmu',
  },
  radOdKuce: {
    label: 'Rad od kuće',
    yearly: 840,
    monthly: 70,
    category: 'cash',
    /**
     * Hard monthly cap — does not behave like a 1/12 share of the yearly limit;
     * any uncollected months do not roll over.
     */
    hardMonthlyCap: true,
    requirement: 'Ugovor o radu mora navoditi izdvojeno mjesto rada',
  },
  odmorRadnika: {
    label: 'Naknada za odmor radnika',
    yearly: 400,
    monthly: 33.33,
    category: 'cash',
    requirement: 'Isplata na žiro, traži račune (turist/ugost)',
  },
  dopunskoZdravstveno: {
    label: 'Dopunsko / dodatno zdravstveno',
    yearly: 500,
    monthly: 41.67,
    category: 'insurance',
    requirement: 'Polica na firmu, bezgotovinski',
  },
  treciStup: {
    label: '3. stup / PEPP',
    description: 'Mirovinska štednja',
    yearly: 796.44,
    monthly: 66.37,
    category: 'pension',
    requirement: 'Uplata u tuzemni DMF ili PEPP',
  },
} as const

export type NonTaxableBenefitKey = keyof typeof NON_TAXABLE_BENEFIT_LIMITS_2026

/**
 * Prehrana (meal allowance) has three mutually exclusive states.
 * `pausal` and `racuni` cannot be combined.
 */
export type MealMode = 'off' | 'pausal' | 'racuni'

export interface NonTaxableBenefitsConfig {
  prigodneNagrade?: boolean
  nagradaZaRezultate?: boolean
  prehrana?: MealMode
  radOdKuce?: boolean
  odmorRadnika?: boolean
  dopunskoZdravstveno?: boolean
  treciStup?: boolean
}

export type BenefitCategory = 'cash' | 'insurance' | 'pension'
/**
 * Where the benefit ends up: in the employee's bank account (cash) or
 * locked in a third-party policy/fund (asset).
 */
export type BenefitFlow = 'cash' | 'asset'

export interface NonTaxableBenefitItem {
  key: NonTaxableBenefitKey
  label: string
  monthly: number
  yearly: number
  category: BenefitCategory
  flow: BenefitFlow
  requirement?: string
}

export interface NonTaxableBenefitsBreakdown {
  items: NonTaxableBenefitItem[]
  cashMonthly: number
  cashYearly: number
  assetMonthly: number
  assetYearly: number
  totalMonthly: number
  totalYearly: number
}

function categoryToFlow(category: BenefitCategory): BenefitFlow {
  return category === 'cash' ? 'cash' : 'asset'
}

function buildItem(key: NonTaxableBenefitKey): NonTaxableBenefitItem {
  const limit = NON_TAXABLE_BENEFIT_LIMITS_2026[key]
  return {
    key,
    label: limit.label,
    monthly: limit.monthly,
    yearly: limit.yearly,
    category: limit.category,
    flow: categoryToFlow(limit.category),
    requirement: limit.requirement,
  }
}

/**
 * Computes which non-taxable benefits are enabled and their monthly/yearly totals,
 * split by destination (cash to employee vs asset growth like 3rd pillar / insurance).
 *
 * @note Kalkulator neoporezivih primitaka
 *
 * @param config - Toggle for each item; prehrana is three-state.
 * @returns Per-item breakdown plus cash, asset, and total sums.
 */
export function calculateNonTaxableBenefits(
  config: NonTaxableBenefitsConfig = {},
): NonTaxableBenefitsBreakdown {
  const items: NonTaxableBenefitItem[] = []

  if (config.prigodneNagrade)
    items.push(buildItem('prigodneNagrade'))
  if (config.nagradaZaRezultate)
    items.push(buildItem('nagradaZaRezultate'))

  const mealMode: MealMode = config.prehrana ?? 'off'
  if (mealMode === 'pausal')
    items.push(buildItem('prehranaPausal'))
  else if (mealMode === 'racuni')
    items.push(buildItem('prehranaRacuni'))

  if (config.radOdKuce)
    items.push(buildItem('radOdKuce'))
  if (config.odmorRadnika)
    items.push(buildItem('odmorRadnika'))
  if (config.dopunskoZdravstveno)
    items.push(buildItem('dopunskoZdravstveno'))
  if (config.treciStup)
    items.push(buildItem('treciStup'))

  let $cashMonthly = new Decimal(0)
  let $assetMonthly = new Decimal(0)

  for (const item of items) {
    const $monthly = new Decimal(item.monthly)
    if (item.flow === 'cash')
      $cashMonthly = $cashMonthly.add($monthly)
    else $assetMonthly = $assetMonthly.add($monthly)
  }

  const $totalMonthly = $cashMonthly.add($assetMonthly)

  return {
    items,
    cashMonthly: roundEuros($cashMonthly.toNumber()),
    cashYearly: roundEuros($cashMonthly.mul(12).toNumber()),
    assetMonthly: roundEuros($assetMonthly.toNumber()),
    assetYearly: roundEuros($assetMonthly.mul(12).toNumber()),
    totalMonthly: roundEuros($totalMonthly.toNumber()),
    totalYearly: roundEuros($totalMonthly.mul(12).toNumber()),
  }
}
