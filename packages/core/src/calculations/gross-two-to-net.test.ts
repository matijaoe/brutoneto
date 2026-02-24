import { describe, expect, it } from 'vitest'
import { grossToNet, grossToNetBreakdown } from './gross-to-net'
import { grossTwoToNet, grossTwoToNetBreakdown } from './gross-two-to-net'
import { grossToTotal } from './salary'

describe('grossTwoToNet', () => {
  it('should calculate correct net from grossTwo using default tax rates', () => {
    const gross = 4000
    const { total: grossTwo } = grossToTotal(gross)
    const expectedNet = grossToNet(gross)

    const result = grossTwoToNet(grossTwo)
    expect(result).toBe(expectedNet)
  })

  it('should calculate correct net from grossTwo for a defined place', () => {
    const gross = 4000
    const { total: grossTwo } = grossToTotal(gross)
    const expectedNet = grossToNet(gross, { place: 'sveta-nedelja-samobor' })

    const result = grossTwoToNet(grossTwo, { place: 'sveta-nedelja-samobor' })
    expect(result).toBe(expectedNet)
  })

  it('should be consistent with grossToNet through grossToTotal roundtrip', () => {
    const testGrossValues = [1000, 2500, 3000, 4000, 5000, 6000, 8000, 10000]

    for (const gross of testGrossValues) {
      const { total: grossTwo } = grossToTotal(gross)
      const expectedNet = grossToNet(gross)
      const result = grossTwoToNet(grossTwo)
      expect(result, `Failed for gross=${gross}, grossTwo=${grossTwo}`).toBe(expectedNet)
    }
  })

  it('should throw for invalid grossTwo values', () => {
    expect(() => grossTwoToNet(-1)).toThrow()
    expect(() => grossTwoToNet(Infinity)).toThrow()
  })
})

describe('grossTwoToNetBreakdown', () => {
  it('should return breakdown with grossTwo field included', () => {
    const gross = 4000
    const { total: grossTwo } = grossToTotal(gross)

    const result = grossTwoToNetBreakdown(grossTwo)
    expect(result.grossTwo).toBe(grossTwo)
    expect(result.gross).toBe(gross)
    expect(result.net).toBe(grossToNet(gross))
  })

  it('should match grossToNetBreakdown results for equivalent gross', () => {
    const gross = 5000
    const { total: grossTwo } = grossToTotal(gross)

    const fromGrossTwo = grossTwoToNetBreakdown(grossTwo)
    const fromGross = grossToNetBreakdown(gross)

    expect(fromGrossTwo.net).toBe(fromGross.net)
    expect(fromGrossTwo.gross).toBe(fromGross.gross)
    expect(fromGrossTwo.totalCostToEmployer).toBe(fromGross.totalCostToEmployer)
    expect(fromGrossTwo.pension).toEqual(fromGross.pension)
    expect(fromGrossTwo.taxes).toEqual(fromGross.taxes)
    expect(fromGrossTwo.healthInsurance).toBe(fromGross.healthInsurance)
  })

  it('should support place configuration', () => {
    const gross = 4000
    const { total: grossTwo } = grossToTotal(gross)

    const result = grossTwoToNetBreakdown(grossTwo, { place: 'zagreb' })
    expect(result.variables.place).toBe('zagreb')
    expect(result.grossTwo).toBe(grossTwo)
  })
})
