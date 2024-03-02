import { expect, test } from 'bun:test'
import { grossToNet } from '.'
import { PlaceTaxes } from './generated/places'

const gross = 3000

// TODO: coefficients, higher and lower taxes, place vs tax params overrides, netToGross...

test('gross to net (default tax rates)', () => {
  const expectedNet = 2032

  // Default
  const res1 = grossToNet(gross)
  expect(res1).toBe(expectedNet)

  // Custom tax rates
  const res2 = grossToNet(gross, { taxRateLow: 0.2, taxRateHigh: 0.3 })
  expect(res2).toBe(expectedNet)

  // Custom place with same rate as default
  const res3 = grossToNet(gross, { place: 'samobor' })
  expect(res3).toBe(expectedNet)

  const res4 = grossToNet(gross, { ...PlaceTaxes['samobor'] })
  expect(res4).toBe(expectedNet)
})

test('gross to net (custom tax rates)', () => {
  const expectedNet = 1965.76

  // Custom tax rates
  const res1 = grossToNet(gross, { taxRateLow: 0.236, taxRateHigh: 0.354 })
  expect(res1).toBe(expectedNet)

  // Custom place with same rates
  const res2 = grossToNet(gross, { place: 'zagreb' })
  expect(res2).toBe(expectedNet)

  const res3 = grossToNet(gross, { ...PlaceTaxes['zagreb'] })
  expect(res3).toBe(expectedNet)
})
