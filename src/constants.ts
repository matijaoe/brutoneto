import { percent } from './utils/precision'

export const RATE = {
  /**
   * Pension contribution rate for the first pillar.
   * @note 1. mirovinski stup
   */
  PENSION_CONTRIBUTION_PILLAR_1: percent(15),
  /**
   * Pension contribution rate for the second pillar.
   * @note 2. mirovinski stup
   */
  PENSION_CONTRIBUTION_PILLAR_2: percent(5),
  /**
   * Health insurance contribution rate.
   * @note zdravstveno osiguranje
   */
  HEALTH_INSURANCE_CONTRIBUTION: percent(16.5),
  /**
   * Low tax bracket rate.
   * @note niža porezna stopa
   */
  TAX_LOW_BRACKET: percent(20),
  /**
   * High tax bracket rate.
   * @note viša porezna stopa
   */
  TAX_HIGH_BRACKET: percent(30),
} as const

/**
 * Threshold for the high tax bracket.
 * @note prag za višu poreznu stopu
 */
export const HIGH_TAX_BRACKET_THRESHOLD = 5_000

/**
 * Basic personal allowance.
 * @note osnovni osobni odbitak
 */
export const BASIC_PERSONAL_ALLOWANCE = 600

/**
 * Coefficient for the personal allowance.
 * @note koeficijent osobnog odbitka
 */
export const PERSONAL_ALLOWANCE_COEFFICIENT = 1

/**
 * The non-taxable limit for the third pillar.
 */
export const THIRD_PILLAR_NON_TAXABLE_LIMIT = 67

/**
 * The minimum personal allowance coefficient.
 */
export const MIN_PERSONAL_ALLOWANCE_COEFFICIENT = 0.3

/**
 * The maximum personal allowance coefficient.
 */
export const MAX_PERSONAL_ALLOWANCE_COEFFICIENT = 6
