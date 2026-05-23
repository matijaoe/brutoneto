export type Mode = 'gross-to-net' | 'net-to-gross' | 'doo'
export type SalaryMode = Exclude<Mode, 'doo'>
export type BrutoType = 'bruto1' | 'bruto2'
export type Period = 'yearly' | 'monthly'

export interface SalaryData {
  net: number
  gross: number
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
    total: number
    lowerBracket: number
    higherBracket: number
  }
  variables: {
    taxRateLow: number
    taxRateHigh: number
  }
}

export interface AdjustedDividend {
  grossDividend: number
  dividendTax: number
  netDividend: number
  retained: number
  monthlyNet: number
  taxReturn: number
  monthlyNetWithTaxReturn: number
  totalWithRetained: number
  /** Profit (revenue − bruto2 − benefits expense), clamped to ≥ 0. */
  profit: number
  /** Corporate tax on the benefits-adjusted profit. */
  corporateTax: number
  /** Profit after corporate tax. */
  profitAfterTax: number
  /** Cash benefits going to employee bank account (sum, €/mo). */
  cashBenefits: number
  /** Asset benefits (insurance + pension), locked, not spendable now (€/mo). */
  assetBenefits: number
  /** Net salary + net dividend + cash benefits — what lands in the bank. */
  cashInHand: number
  /** Company balance (retained) + asset benefits — locked savings/assets. */
  assets: number
  /** Cash in hand + assets — total monthly value produced. */
  totalValue: number
  /** Estimated tax saving vs taking the same amount through dividend. */
  savingsVsDividend: number
}

export interface ConversionNote {
  input: string
  eur: string
  monthlyEur?: string | null
}

export interface BreakdownRow {
  label: string
  value: string
  type: 'primary' | 'supporting' | 'sub-heading' | 'summary'
  color?: 'neutral' | 'purple' | 'green' | 'red'
}

export interface BreakdownSection {
  title: string
  badge?: string
  rows: BreakdownRow[]
}
