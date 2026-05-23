import { describe, expect, it } from 'vitest'
import { roundEuros } from '../utils/precision'
import {
  calculateNonTaxableBenefits,
  NON_TAXABLE_BENEFIT_LIMITS_2026,
} from './non-taxable-benefits'

describe('calculateNonTaxableBenefits', () => {
  it('should return empty breakdown with no config', () => {
    const result = calculateNonTaxableBenefits()
    expect(result.items).toEqual([])
    expect(result.cashMonthly).toBe(0)
    expect(result.cashYearly).toBe(0)
    expect(result.assetMonthly).toBe(0)
    expect(result.assetYearly).toBe(0)
    expect(result.totalMonthly).toBe(0)
    expect(result.totalYearly).toBe(0)
  })

  it('should return empty breakdown when all toggles are off', () => {
    const result = calculateNonTaxableBenefits({
      prigodneNagrade: false,
      nagradaZaRezultate: false,
      prehrana: 'off',
      radOdKuce: false,
      odmorRadnika: false,
      dopunskoZdravstveno: false,
      treciStup: false,
    })
    expect(result.items).toEqual([])
    expect(result.totalMonthly).toBe(0)
  })

  it('should include prigodne nagrade when enabled', () => {
    const result = calculateNonTaxableBenefits({ prigodneNagrade: true })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]!.key).toBe('prigodneNagrade')
    expect(result.cashMonthly).toBe(NON_TAXABLE_BENEFIT_LIMITS_2026.prigodneNagrade.monthly)
  })

  it('should not include prehrana when set to off', () => {
    const result = calculateNonTaxableBenefits({ prehrana: 'off' })
    expect(result.items).toEqual([])
  })

  it('should use prehrana paušal when selected', () => {
    const result = calculateNonTaxableBenefits({ prehrana: 'pausal' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]!.key).toBe('prehranaPausal')
    expect(result.cashMonthly).toBe(100)
  })

  it('should use prehrana računi when selected', () => {
    const result = calculateNonTaxableBenefits({ prehrana: 'racuni' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]!.key).toBe('prehranaRacuni')
    expect(result.cashMonthly).toBe(150)
  })

  it('should treat prehrana paušal and računi as mutually exclusive (only one ever appears)', () => {
    const pausal = calculateNonTaxableBenefits({ prehrana: 'pausal' })
    const racuni = calculateNonTaxableBenefits({ prehrana: 'racuni' })
    expect(pausal.items).toHaveLength(1)
    expect(racuni.items).toHaveLength(1)
    expect(pausal.items[0]!.key).not.toBe(racuni.items[0]!.key)
  })

  it('should categorize insurance and pension as assets, not cash', () => {
    const result = calculateNonTaxableBenefits({
      dopunskoZdravstveno: true,
      treciStup: true,
    })
    expect(result.cashMonthly).toBe(0)
    expect(result.assetMonthly).toBe(
      roundEuros(
        NON_TAXABLE_BENEFIT_LIMITS_2026.dopunskoZdravstveno.monthly
        + NON_TAXABLE_BENEFIT_LIMITS_2026.treciStup.monthly,
      ),
    )
    for (const item of result.items) {
      expect(item.flow).toBe('asset')
    }
  })

  it('should split cash and asset totals correctly', () => {
    const result = calculateNonTaxableBenefits({
      prigodneNagrade: true,
      treciStup: true,
    })
    expect(result.cashMonthly).toBe(NON_TAXABLE_BENEFIT_LIMITS_2026.prigodneNagrade.monthly)
    expect(result.assetMonthly).toBe(NON_TAXABLE_BENEFIT_LIMITS_2026.treciStup.monthly)
    expect(result.totalMonthly).toBe(
      roundEuros(result.cashMonthly + result.assetMonthly),
    )
  })

  it('should compute yearly as 12 × monthly', () => {
    const result = calculateNonTaxableBenefits({
      prigodneNagrade: true,
      nagradaZaRezultate: true,
      prehrana: 'racuni',
      radOdKuce: true,
      odmorRadnika: true,
      dopunskoZdravstveno: true,
      treciStup: true,
    })
    expect(result.cashYearly).toBe(roundEuros(result.cashMonthly * 12))
    expect(result.assetYearly).toBe(roundEuros(result.assetMonthly * 12))
    expect(result.totalYearly).toBe(roundEuros(result.totalMonthly * 12))
  })

  it('should cap rad od kuće at €70/mo (hard monthly cap, not 1/12)', () => {
    const result = calculateNonTaxableBenefits({ radOdKuce: true })
    expect(result.cashMonthly).toBe(70)
  })

  it('should preserve item metadata (category, requirement)', () => {
    const result = calculateNonTaxableBenefits({
      radOdKuce: true,
      treciStup: true,
    })
    const radOdKuce = result.items.find(i => i.key === 'radOdKuce')!
    const treciStup = result.items.find(i => i.key === 'treciStup')!
    expect(radOdKuce.category).toBe('cash')
    expect(radOdKuce.flow).toBe('cash')
    expect(radOdKuce.requirement).toContain('izdvojeno')
    expect(treciStup.category).toBe('pension')
    expect(treciStup.flow).toBe('asset')
  })

  it('should sum all benefits when everything is enabled', () => {
    const result = calculateNonTaxableBenefits({
      prigodneNagrade: true,
      nagradaZaRezultate: true,
      prehrana: 'racuni',
      radOdKuce: true,
      odmorRadnika: true,
      dopunskoZdravstveno: true,
      treciStup: true,
    })

    const expectedCash = roundEuros(
      NON_TAXABLE_BENEFIT_LIMITS_2026.prigodneNagrade.monthly
      + NON_TAXABLE_BENEFIT_LIMITS_2026.nagradaZaRezultate.monthly
      + NON_TAXABLE_BENEFIT_LIMITS_2026.prehranaRacuni.monthly
      + NON_TAXABLE_BENEFIT_LIMITS_2026.radOdKuce.monthly
      + NON_TAXABLE_BENEFIT_LIMITS_2026.odmorRadnika.monthly,
    )
    const expectedAsset = roundEuros(
      NON_TAXABLE_BENEFIT_LIMITS_2026.dopunskoZdravstveno.monthly
      + NON_TAXABLE_BENEFIT_LIMITS_2026.treciStup.monthly,
    )

    expect(result.cashMonthly).toBe(expectedCash)
    expect(result.assetMonthly).toBe(expectedAsset)
    expect(result.totalMonthly).toBe(roundEuros(expectedCash + expectedAsset))
    expect(result.items).toHaveLength(7)
  })
})
